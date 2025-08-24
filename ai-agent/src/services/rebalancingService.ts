import { VyanContract } from '../contract/vyanContract';
import { Station, StationStatus, RebalancingRoute, RebalancingRecommendation } from '../types';
import { config } from '../config';

export class RebalancingService {
  private vyanContract: VyanContract;

  constructor(vyanContract: VyanContract) {
    this.vyanContract = vyanContract;
  }

  /**
   * Analyze station status and determine if rebalancing is needed
   */
  async analyzeStationStatus(stationId: string): Promise<StationStatus> {
    try {
      const stationDetails = await this.vyanContract.getStationDetails(stationId);
      
      const utilizationRate = stationDetails.totalSlots > 0 
        ? (stationDetails.totalSlots - stationDetails.availableSlots) / stationDetails.totalSlots
        : 0;

      const needsRebalancing = this.determineRebalancingNeed(
        stationDetails.availableSlots,
        stationDetails.totalSlots,
        utilizationRate
      );

      const priority = this.calculatePriority(
        stationDetails.availableSlots,
        stationDetails.totalSlots,
        utilizationRate
      );

      return {
        stationId,
        availableSlots: stationDetails.availableSlots,
        totalSlots: stationDetails.totalSlots,
        utilizationRate,
        needsRebalancing,
        priority
      };
    } catch (error) {
      console.error(`Failed to analyze station status for ${stationId}:`, error);
      throw error;
    }
  }

  /**
   * Determine if a station needs rebalancing
   */
  private determineRebalancingNeed(
    availableSlots: number,
    totalSlots: number,
    utilizationRate: number
  ): boolean {
    // Station needs rebalancing if:
    // 1. Available slots are below minimum threshold
    // 2. Utilization rate is above threshold (too full)
    // 3. Available slots are very low relative to total capacity
    
    const minAvailableSlots = config.rebalancing.minAvailableSlots;
    const threshold = config.rebalancing.threshold;

    return (
      availableSlots < minAvailableSlots ||
      utilizationRate > (1 - threshold) ||
      (availableSlots / totalSlots) < threshold
    );
  }

  /**
   * Calculate rebalancing priority
   */
  private calculatePriority(
    availableSlots: number,
    totalSlots: number,
    utilizationRate: number
  ): 'high' | 'medium' | 'low' {
    const minAvailableSlots = config.rebalancing.minAvailableSlots;
    const threshold = config.rebalancing.threshold;

    if (availableSlots < minAvailableSlots || utilizationRate > 0.9) {
      return 'high';
    } else if (availableSlots < (minAvailableSlots * 2) || utilizationRate > (1 - threshold)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate rebalancing routes between stations
   */
  async generateRebalancingRoutes(
    sourceStations: Station[],
    targetStations: Station[]
  ): Promise<RebalancingRoute[]> {
    const routes: RebalancingRoute[] = [];

    // Find stations that need batteries (low available slots)
    const needyStations = targetStations.filter(station => 
      station.availableSlots < config.rebalancing.minAvailableSlots
    );

    // Find stations with excess batteries (high available slots)
    const excessStations = sourceStations.filter(station => 
      station.availableSlots > (station.totalSlots * 0.7)
    );

    // Generate routes from excess stations to needy stations
    for (const excessStation of excessStations) {
      for (const needyStation of needyStations) {
        const availableBatteries = Math.min(
          excessStation.availableSlots - Math.floor(excessStation.totalSlots * 0.5), // Keep 50% capacity
          needyStation.totalSlots - needyStation.availableSlots
        );

        if (availableBatteries > 0) {
          const priority = this.calculateRoutePriority(
            excessStation.availableSlots,
            excessStation.totalSlots,
            needyStation.availableSlots,
            needyStation.totalSlots
          );

          routes.push({
            fromStation: excessStation.id,
            toStation: needyStation.id,
            batteryCount: availableBatteries,
            priority,
            reason: `Rebalance from excess station (${excessStation.availableSlots}/${excessStation.totalSlots}) to needy station (${needyStation.availableSlots}/${needyStation.totalSlots})`,
            estimatedDistance: this.calculateDistance(
              excessStation.latitude,
              excessStation.longitude,
              needyStation.latitude,
              needyStation.longitude
            )
          });
        }
      }
    }

    // Sort routes by priority and battery count
    return routes.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.batteryCount - a.batteryCount;
    });
  }

  /**
   * Calculate route priority based on station conditions
   */
  private calculateRoutePriority(
    fromAvailable: number,
    fromTotal: number,
    toAvailable: number,
    toTotal: number
  ): 'high' | 'medium' | 'low' {
    const fromUtilization = (fromTotal - fromAvailable) / fromTotal;
    const toUtilization = (toTotal - toAvailable) / toTotal;

    if (fromUtilization > 0.8 && toUtilization < 0.3) {
      return 'high';
    } else if (fromUtilization > 0.6 && toUtilization < 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate comprehensive rebalancing recommendation
   */
  async generateRebalancingRecommendation(
    operatorAddress: string
  ): Promise<RebalancingRecommendation> {
    try {
      // Get all operator stations
      const operatorStations = await this.vyanContract.getOperatorStations(operatorAddress);
      
      if (operatorStations.length === 0) {
        throw new Error('No stations found for operator');
      }

      // Analyze all station statuses
      const stationStatuses = await Promise.all(
        operatorStations.map(station => this.analyzeStationStatus(station.id))
      );

      // Filter stations that need rebalancing
      const stationsNeedingRebalancing = stationStatuses.filter(
        status => status.needsRebalancing
      );

      if (stationsNeedingRebalancing.length === 0) {
        return {
          routes: [],
          summary: 'All stations are well-balanced. No rebalancing needed.',
          totalBatteriesToMove: 0,
          estimatedCost: 0,
          timestamp: Date.now()
        };
      }

      // Generate rebalancing routes
      const routes = await this.generateRebalancingRoutes(
        operatorStations,
        operatorStations
      );

      const totalBatteriesToMove = routes.reduce((sum, route) => sum + route.batteryCount, 0);
      const estimatedCost = this.estimateRebalancingCost(routes);

      const summary = this.generateSummary(stationStatuses, routes);

      return {
        routes,
        summary,
        totalBatteriesToMove,
        estimatedCost,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to generate rebalancing recommendation:', error);
      throw error;
    }
  }

  /**
   * Estimate the cost of rebalancing operations
   */
  private estimateRebalancingCost(routes: RebalancingRoute[]): number {
    // Base cost per battery moved
    const baseCostPerBattery = 0.1; // SEI tokens
    const distanceCostPerKm = 0.01; // SEI tokens per km
    
    return routes.reduce((totalCost, route) => {
      const distanceCost = (route.estimatedDistance || 0) * distanceCostPerKm;
      const batteryCost = route.batteryCount * baseCostPerBattery;
      return totalCost + distanceCost + batteryCost;
    }, 0);
  }

  /**
   * Generate human-readable summary of rebalancing needs
   */
  private generateSummary(
    stationStatuses: StationStatus[],
    routes: RebalancingRoute[]
  ): string {
    const highPriorityStations = stationStatuses.filter(s => s.priority === 'high').length;
    const totalRoutes = routes.length;
    const highPriorityRoutes = routes.filter(r => r.priority === 'high').length;

    return `Rebalancing analysis complete. ${highPriorityStations} stations require immediate attention. ` +
           `Generated ${totalRoutes} rebalancing routes (${highPriorityRoutes} high priority). ` +
           `Total batteries to move: ${routes.reduce((sum, r) => sum + r.batteryCount, 0)}.`;
  }
}
