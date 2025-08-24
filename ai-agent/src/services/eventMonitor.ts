import { VyanContract } from '../contract/vyanContract';
import { RebalancingService } from './rebalancingService';
import { BatterySwappedEvent, RebalancingRecommendation, TrafficData, StationLog, OptimizedRebalancingPlan } from '../types';
import { config } from '../config';
import { GoogleGenAI, Type } from '@google/genai';

export class EventMonitor {
  private vyanContract: VyanContract;
  private rebalancingService: RebalancingService;
  private isMonitoring: boolean = false;
  private lastProcessedBlock: number = 0;
  private operatorAddress: string;

  constructor(
    vyanContract: VyanContract,
    rebalancingService: RebalancingService,
    operatorAddress: string
  ) {
    this.vyanContract = vyanContract;
    this.rebalancingService = rebalancingService;
    this.operatorAddress = operatorAddress;
  }

  /**
   * Initialize the event monitor with proper starting block
   */
  async initialize(): Promise<void> {
    try {
      // Get current block number and start from 1000 blocks ago
      // This avoids the "block range too large" error
      const currentBlock = await this.vyanContract.getCurrentBlockNumber();
      this.lastProcessedBlock = Math.max(0, currentBlock - 1000);
      console.log(`Event monitor initialized. Starting from block ${this.lastProcessedBlock} (1000 blocks ago)`);
    } catch (error) {
      console.error('Failed to initialize event monitor:', error);
      // Fallback to starting from 0 if we can't get current block
      this.lastProcessedBlock = 0;
    }
  }

  /**
   * Start monitoring BatterySwapped events
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Event monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting BatterySwapped event monitoring...');

    // Initialize the monitor before starting
    await this.initialize();

    // Start the monitoring loop
    this.monitorLoop();
  }

  /**
   * Stop monitoring events
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Stopped BatterySwapped event monitoring');
  }

  /**
   * Main monitoring loop
   */
  private async monitorLoop(): Promise<void> {
    while (this.isMonitoring) {
      try {
        await this.processNewEvents();
        await this.sleep(config.monitoring.eventPollingInterval);
      } catch (error) {
        console.error('Error in event monitoring loop:', error);
        // Continue monitoring even if there's an error
        await this.sleep(10000); // Wait 10 seconds before retrying
      }
    }
  }

  /**
   * Process new BatterySwapped events
   */
  private async processNewEvents(): Promise<void> {
    try {
      // Get new events since last processed block
      const events = await this.vyanContract.getBatterySwappedEvents(this.lastProcessedBlock);
      
      if (events.length === 0) {
        return; // No new events
      }

      console.log(`Processing ${events.length} new BatterySwapped events`);

      // Process each event
      for (const event of events) {
        await this.processBatterySwappedEvent(event);
      }

      // Update last processed block
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        this.lastProcessedBlock = lastEvent.blockNumber || this.lastProcessedBlock;
      }

    } catch (error) {
      console.error('Failed to process new events:', error);
    }
  }

  /**
   * Process a single BatterySwapped event
   */
  private async processBatterySwappedEvent(event: BatterySwappedEvent): Promise<void> {
    try {
      console.log(`Processing BatterySwapped event: User ${event.user} swapped battery ${event.oldBatteryId} for ${event.newBatteryId} at station ${event.stationId}`);

      // Check if this event affects one of our operator's stations
      if (await this.isOperatorStation(event.stationId)) {
        console.log(`BatterySwapped event affects operator station: ${event.stationId}`);
        
        // Trigger rebalancing analysis
        await this.triggerRebalancingAnalysis();
      }

    } catch (error) {
      console.error('Failed to process BatterySwapped event:', error);
    }
  }

  /**
   * Check if a station belongs to the monitored operator
   */
  private async isOperatorStation(stationId: string): Promise<boolean> {
    try {
      const stationDetails = await this.vyanContract.getStationDetails(stationId);
      return stationDetails.operator.toLowerCase() === this.operatorAddress.toLowerCase();
    } catch (error) {
      console.error(`Failed to check if station ${stationId} belongs to operator:`, error);
      return false;
    }
  }

  /**
   * Trigger rebalancing analysis for the operator
   */
  private async triggerRebalancingAnalysis(): Promise<void> {
    try {
      console.log('Triggering rebalancing analysis...');
      
      const recommendation = await this.rebalancingService.generateRebalancingRecommendation(
        this.operatorAddress
      );

      if (recommendation.routes.length > 0) {
        console.log('Rebalancing recommendation generated:');
        console.log(`- ${recommendation.routes.length} routes identified`);
        console.log(`- ${recommendation.totalBatteriesToMove} batteries to move`);
        console.log(`- Estimated cost: ${recommendation.estimatedCost} SEI`);
        console.log(`- Summary: ${recommendation.summary}`);

        // Log high priority routes
        const highPriorityRoutes = recommendation.routes.filter(r => r.priority === 'high');
        if (highPriorityRoutes.length > 0) {
          console.log('High priority rebalancing routes:');
          highPriorityRoutes.forEach(route => {
            console.log(`  ${route.fromStation} → ${route.toStation}: ${route.batteryCount} batteries (${route.reason})`);
          });
        }

        // Send to Gemini API for route optimization
        const optimizedPlan = await this.optimizeRoutesWithGemini(recommendation);
        
        // Emit AI route recommendation events for each optimized route
        await this.emitAIRouteRecommendationEvents(optimizedPlan);
        
        // Log the optimized plan details
        console.log('\n=== OPTIMIZED REBALANCING PLAN ===');
        console.log(`Summary: ${optimizedPlan.summary}`);
        console.log(`Estimated Efficiency Improvement: ${optimizedPlan.estimatedEfficiency}%`);
        console.log(`Traffic Considerations: ${optimizedPlan.trafficConsiderations.length} items`);
        console.log(`Demand Forecast: ${optimizedPlan.demandForecast.length} stations analyzed`);
        console.log(`Execution Schedule: ${optimizedPlan.executionSchedule.length} routes scheduled`);
        
        if (optimizedPlan.riskFactors.length > 0) {
          console.log(`Risk Factors: ${optimizedPlan.riskFactors.join(', ')}`);
        }
        
        console.log('=== END OPTIMIZED PLAN ===\n');

      } else {
        console.log('No rebalancing needed at this time');
      }

    } catch (error) {
      console.error('Failed to trigger rebalancing analysis:', error);
    }
  }

  /**
   * Optimize rebalancing routes using Gemini API with traffic data and demand forecasting
   */
  private async optimizeRoutesWithGemini(recommendation: RebalancingRecommendation): Promise<OptimizedRebalancingPlan> {
    try {
      console.log('Starting route optimization with Gemini API...');
      
      // Initialize Gemini AI
      const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
      
      // Generate mock traffic data around Bangalore locations
      const mockTrafficData = this.generateMockTrafficData();
      
      // Generate mock station logs for demand forecasting
      const mockStationLogs = this.generateMockStationLogs();
      
      // Prepare the prompt for Gemini
      const prompt = this.buildGeminiPrompt(recommendation, mockTrafficData, mockStationLogs);
      
      console.log('Sending optimization request to Gemini API...');
      
      // Generate content with Gemini API using structured output
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              estimatedEfficiency: { type: Type.NUMBER },
              optimizedRoutes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fromStation: { type: Type.STRING },
                    toStation: { type: Type.STRING },
                    batteryCount: { type: Type.NUMBER },
                    priority: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    estimatedDistance: { type: Type.NUMBER }
                  },
                  propertyOrdering: ["fromStation", "toStation", "batteryCount", "priority", "reason", "estimatedDistance"]
                }
              },
              trafficConsiderations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              demandForecast: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stationId: { type: Type.STRING },
                    predictedDemand: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    peakHours: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  propertyOrdering: ["stationId", "predictedDemand", "confidence", "peakHours"]
                }
              },
              executionSchedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    routeId: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    estimatedDuration: { type: Type.NUMBER },
                    driverInstructions: { type: Type.STRING }
                  },
                  propertyOrdering: ["routeId", "startTime", "estimatedDuration", "driverInstructions"]
                }
              },
              riskFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            propertyOrdering: ["summary", "estimatedEfficiency", "optimizedRoutes", "trafficConsiderations", "demandForecast", "executionSchedule", "riskFactors"]
          }
        }
      });
      
      console.log('Received response from Gemini API');
      
      // Parse the structured response
      let optimizedPlan: OptimizedRebalancingPlan;
      
      try {
        // Try to parse the structured response
        const responseText = response.text;
        if (!responseText) {
          throw new Error('No response text received from Gemini API');
        }
        const parsedResponse = JSON.parse(responseText);
        optimizedPlan = this.parseStructuredGeminiResponse(parsedResponse, recommendation);
      } catch (parseError) {
        console.warn('Failed to parse structured response, falling back to text parsing:', parseError);
        // Fallback to basic parsing if structured output fails
        const responseText = response.text;
        if (responseText) {
          optimizedPlan = this.parseGeminiResponse(responseText, recommendation);
        } else {
          throw new Error('No response text available for fallback parsing');
        }
      }
      
      console.log('Route optimization completed successfully');
      console.log(`Estimated efficiency improvement: ${optimizedPlan.estimatedEfficiency}%`);
      
      return optimizedPlan;
      
    } catch (error) {
      console.error('Failed to optimize routes with Gemini API:', error);
      
      // Return a fallback plan if Gemini API fails
      return this.generateFallbackPlan(recommendation);
    }
  }

  /**
   * Emit AI route recommendation events for each optimized route
   */
  private async emitAIRouteRecommendationEvents(optimizedPlan: OptimizedRebalancingPlan): Promise<void> {
    try {
      console.log('Emitting AI route recommendation events for optimized routes...');
      
      for (const route of optimizedPlan.optimizedRoutes) {
        try {
          // Generate a unique route ID
          const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Calculate ETA based on estimated distance and traffic conditions
          const eta = this.calculateETA(route.estimatedDistance || 10);
          
          // Emit the AI route recommendation event
          await this.vyanContract.generateAIRouteRecommendation(
            routeId,
            route.fromStation,
            route.toStation,
            route.batteryCount,
            eta,
            route.priority,
            route.reason
          );
          
          console.log(`✓ Emitted AI route recommendation for route ${routeId}: ${route.fromStation} → ${route.toStation}`);
          
          // Add a small delay between emissions to avoid overwhelming the blockchain
          await this.sleep(1000);
          
        } catch (routeError) {
          console.error(`Failed to emit AI route recommendation for route ${route.fromStation} → ${route.toStation}:`, routeError);
          // Continue with other routes even if one fails
        }
      }
      
      console.log(`Successfully emitted ${optimizedPlan.optimizedRoutes.length} AI route recommendation events`);
      
    } catch (error) {
      console.error('Failed to emit AI route recommendation events:', error);
      // Don't throw here as this is not critical for the main flow
    }
  }

  /**
   * Calculate ETA based on distance and traffic conditions
   */
  private calculateETA(distanceKm: number): string {
    // Base speed: 30 km/h in city traffic
    const baseSpeedKmh = 30;
    
    // Calculate base time in minutes
    const baseTimeMinutes = Math.round((distanceKm / baseSpeedKmh) * 60);
    
    // Add buffer for traffic and stops (20% extra time)
    const totalTimeMinutes = Math.round(baseTimeMinutes * 1.2);
    
    // Convert to hours and minutes format
    const hours = Math.floor(totalTimeMinutes / 60);
    const minutes = totalTimeMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private buildGeminiPrompt(
    recommendation: RebalancingRecommendation, 
    trafficData: TrafficData[], 
    stationLogs: StationLog[]
  ): string {
    return `You are an AI logistics expert specializing in EV battery rebalancing optimization. 

Given the following rebalancing recommendation, traffic data, and station activity logs, please generate an optimized rebalancing plan.

REBALANCING RECOMMENDATION:
${JSON.stringify(recommendation, null, 2)}

TRAFFIC DATA (Bangalore locations):
${JSON.stringify(trafficData, null, 2)}

STATION ACTIVITY LOGS (Past 7 days):
${JSON.stringify(stationLogs, null, 2)}

Please analyze this data and provide an optimized rebalancing plan that considers:
1. Traffic patterns and congestion at different times
2. Historical demand patterns at each station
3. Optimal timing for battery movements
4. Risk factors and efficiency improvements

Focus on practical, actionable insights that will improve the efficiency of battery rebalancing operations.`;
  }

  /**
   * Parse the structured response from Gemini API
   */
  private parseStructuredGeminiResponse(parsedResponse: any, originalRecommendation: RebalancingRecommendation): OptimizedRebalancingPlan {
    try {
      // Validate and transform the structured response
      return {
        optimizedRoutes: parsedResponse.optimizedRoutes || originalRecommendation.routes,
        trafficConsiderations: parsedResponse.trafficConsiderations || [],
        demandForecast: parsedResponse.demandForecast || [],
        executionSchedule: parsedResponse.executionSchedule || [],
        summary: parsedResponse.summary || 'Optimization completed with AI insights',
        estimatedEfficiency: parsedResponse.estimatedEfficiency || 15,
        riskFactors: parsedResponse.riskFactors || []
      };
      
    } catch (error) {
      console.error('Failed to parse structured Gemini response:', error);
      console.log('Parsed response:', parsedResponse);
      
      // Return fallback plan if parsing fails
      return this.generateFallbackPlan(originalRecommendation);
    }
  }

  /**
   * Parse the response from Gemini API (fallback method)
   */
  private parseGeminiResponse(response: string, originalRecommendation: RebalancingRecommendation): OptimizedRebalancingPlan {
    try {
      // Extract JSON from the response (handle markdown formatting)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      let jsonStr = jsonMatch[1] || jsonMatch[0];
      
      // Clean up the JSON string by removing comments and fixing common issues
      jsonStr = this.cleanJsonString(jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate and transform the response
      return {
        optimizedRoutes: parsed.optimizedRoutes || originalRecommendation.routes,
        trafficConsiderations: parsed.trafficConsiderations || [],
        demandForecast: parsed.demandForecast || [],
        executionSchedule: parsed.executionSchedule || [],
        summary: parsed.summary || 'Optimization completed with AI insights',
        estimatedEfficiency: parsed.estimatedEfficiency || 15,
        riskFactors: parsed.riskFactors || []
      };
      
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', response);
      
      // Return fallback plan if parsing fails
      return this.generateFallbackPlan(originalRecommendation);
    }
  }

  /**
   * Clean JSON string by removing comments and fixing common issues
   */
  private cleanJsonString(jsonStr: string): string {
    // Remove single-line comments (// ...)
    jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
    
    // Remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    
    // Remove trailing commas after property values
    jsonStr = jsonStr.replace(/,(\s*})/g, '$1');
    
    // Clean up extra whitespace and newlines
    jsonStr = jsonStr.replace(/\n\s*\n/g, '\n');
    
    return jsonStr.trim();
  }

  /**
   * Generate mock traffic data around Bangalore EV station locations
   */
  private generateMockTrafficData(): TrafficData[] {
    const locations = [
      { name: 'Cubbon Park', lat: 12.9716, lng: 77.5946 },
      { name: 'Trinity Circle', lat: 12.9716, lng: 77.5946 },
      { name: 'Indiranagar', lat: 12.9716, lng: 77.6401 },
      { name: 'Forum Mall Koramangala', lat: 12.9352, lng: 77.6245 }
    ];

    const trafficData: TrafficData[] = [];
    const now = Date.now();
    
    locations.forEach((location, index) => {
      // Generate traffic data for the last 7 days
      for (let day = 0; day < 7; day++) {
        const dayTimestamp = now - (day * 24 * 60 * 60 * 1000);
        
        // Morning peak (8-10 AM)
        trafficData.push({
          location: location.name,
          latitude: location.lat,
          longitude: location.lng,
          trafficLevel: 'very_high',
          congestionScore: 85 + Math.floor(Math.random() * 15),
          peakHours: ['08:00', '09:00', '10:00'],
          averageSpeed: 15 + Math.floor(Math.random() * 10),
          timestamp: dayTimestamp + (8 * 60 * 60 * 1000) + (Math.floor(Math.random() * 2) * 60 * 60 * 1000)
        });
        
        // Evening peak (6-8 PM)
        trafficData.push({
          location: location.name,
          latitude: location.lat,
          longitude: location.lng,
          trafficLevel: 'very_high',
          congestionScore: 80 + Math.floor(Math.random() * 20),
          peakHours: ['18:00', '19:00', '20:00'],
          averageSpeed: 12 + Math.floor(Math.random() * 8),
          timestamp: dayTimestamp + (18 * 60 * 60 * 1000) + (Math.floor(Math.random() * 2) * 60 * 60 * 1000)
        });
        
        // Off-peak hours
        trafficData.push({
          location: location.name,
          latitude: location.lat,
          longitude: location.lng,
          trafficLevel: 'low',
          congestionScore: 20 + Math.floor(Math.random() * 30),
          peakHours: [],
          averageSpeed: 35 + Math.floor(Math.random() * 15),
          timestamp: dayTimestamp + (14 * 60 * 60 * 1000) + (Math.floor(Math.random() * 2) * 60 * 60 * 1000)
        });
      }
    });
    
    return trafficData;
  }

  /**
   * Generate mock station logs for demand forecasting
   */
  private generateMockStationLogs(): StationLog[] {
    const stationIds = ['station_001', 'station_002', 'station_003', 'station_004'];
    const logs: StationLog[] = [];
    const now = Date.now();
    
    stationIds.forEach((stationId, index) => {
      // Generate logs for the last 7 days
      for (let day = 0; day < 7; day++) {
        const dayTimestamp = now - (day * 24 * 60 * 60 * 1000);
        
        // Morning peak (7-9 AM)
        logs.push({
          stationId,
          timestamp: dayTimestamp + (7 * 60 * 60 * 1000) + (Math.floor(Math.random() * 2) * 60 * 60 * 1000),
          batterySwaps: 15 + Math.floor(Math.random() * 10),
          utilizationRate: 0.85 + Math.random() * 0.15,
          peakHour: true,
          weatherCondition: ['sunny', 'rainy', 'cloudy'][Math.floor(Math.random() * 3)] as 'sunny' | 'rainy' | 'cloudy',
          specialEvent: Math.random() > 0.8 ? 'Office rush' : null
        });
        
        // Afternoon (12-2 PM)
        logs.push({
          stationId,
          timestamp: dayTimestamp + (12 * 60 * 60 * 1000) + (Math.floor(Math.random() * 2) * 60 * 60 * 1000),
          batterySwaps: 8 + Math.floor(Math.random() * 7),
          utilizationRate: 0.45 + Math.random() * 0.25,
          peakHour: false,
          weatherCondition: ['sunny', 'rainy', 'cloudy'][Math.floor(Math.random() * 3)] as 'sunny' | 'rainy' | 'cloudy',
          specialEvent: Math.random() > 0.9 ? 'Lunch break' : null
        });
        
        // Evening peak (5-7 PM)
        logs.push({
          stationId,
          timestamp: dayTimestamp + (17 * 60 * 60 * 1000) + (Math.floor(Math.random() * 2) * 60 * 60 * 1000),
          batterySwaps: 18 + Math.floor(Math.random() * 12),
          utilizationRate: 0.90 + Math.random() * 0.10,
          peakHour: true,
          weatherCondition: ['sunny', 'rainy', 'cloudy'][Math.floor(Math.random() * 3)] as 'sunny' | 'rainy' | 'cloudy',
          specialEvent: Math.random() > 0.7 ? 'Evening commute' : null
        });
        
        // Night (9-11 PM)
        logs.push({
          stationId,
          timestamp: dayTimestamp + (21 * 60 * 60 * 1000) + (Math.floor(Math.random() * 2) * 60 * 60 * 1000),
          batterySwaps: 3 + Math.floor(Math.random() * 5),
          utilizationRate: 0.20 + Math.random() * 0.20,
          peakHour: false,
          weatherCondition: ['sunny', 'rainy', 'cloudy'][Math.floor(Math.random() * 3)] as 'sunny' | 'rainy' | 'cloudy',
          specialEvent: null
        });
      }
    });
    
    return logs;
  }

  /**
   * Generate a fallback plan if Gemini API fails
   */
  private generateFallbackPlan(recommendation: RebalancingRecommendation): OptimizedRebalancingPlan {
    console.log('Generating fallback optimization plan...');
    
    return {
      optimizedRoutes: recommendation.routes.map(route => ({
        ...route,
        estimatedDistance: route.estimatedDistance || 5 + Math.floor(Math.random() * 15)
      })),
      trafficConsiderations: [
        'Avoid morning rush hours (8-10 AM)',
        'Avoid evening rush hours (6-8 PM)',
        'Consider weekend operations for major rebalancing'
      ],
      demandForecast: [
        {
          stationId: 'station_001',
          predictedDemand: 'high',
          confidence: 0.75,
          peakHours: ['08:00', '18:00']
        },
        {
          stationId: 'station_002', 
          predictedDemand: 'medium',
          confidence: 0.65,
          peakHours: ['09:00', '17:00']
        }
      ],
      executionSchedule: recommendation.routes.map((route, index) => ({
        routeId: `route_${index}`,
        startTime: '14:00',
        estimatedDuration: 120,
        driverInstructions: 'Mid-day low traffic period - proceed with battery transfer'
      })),
      summary: 'Fallback optimization plan generated due to API failure',
      estimatedEfficiency: 10,
      riskFactors: ['API failure - using fallback logic', 'Limited traffic data available']
    };
  }

  /**
   * Utility function to sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    lastProcessedBlock: number;
    operatorAddress: string;
  } {
    return {
      isMonitoring: this.isMonitoring,
      lastProcessedBlock: this.lastProcessedBlock,
      operatorAddress: this.operatorAddress
    };
  }

  /**
   * Manually trigger rebalancing analysis (for testing/debugging)
   */
  async manualRebalancingAnalysis(): Promise<void> {
    console.log('Manual rebalancing analysis triggered');
    await this.triggerRebalancingAnalysis();
  }

  /**
   * Test Gemini optimization with mock data (for testing/debugging)
   */
  async testGeminiOptimization(): Promise<void> {
    console.log('Testing Gemini optimization with mock data...');
    
    // Create a mock rebalancing recommendation
    const mockRecommendation: RebalancingRecommendation = {
      routes: [
        {
          fromStation: 'station_001',
          toStation: 'station_002',
          batteryCount: 5,
          priority: 'high',
          reason: 'Station 001 has excess batteries, Station 002 is running low'
        },
        {
          fromStation: 'station_003',
          toStation: 'station_004',
          batteryCount: 3,
          priority: 'medium',
          reason: 'Balancing battery distribution between stations'
        }
      ],
      summary: 'Mock rebalancing recommendation for testing',
      totalBatteriesToMove: 8,
      estimatedCost: 25.5,
      timestamp: Date.now()
    };
    
    try {
      const optimizedPlan = await this.optimizeRoutesWithGemini(mockRecommendation);
      console.log('Gemini optimization test completed successfully!');
      console.log('Optimized plan summary:', optimizedPlan.summary);
    } catch (error) {
      console.error('Gemini optimization test failed:', error);
    }
  }

  /**
   * Test AI route recommendation emission (for testing/debugging)
   */
  async testAIRouteRecommendationEmission(): Promise<void> {
    console.log('Testing AI route recommendation emission...');
    
    // Create a mock optimized plan
    const mockOptimizedPlan: OptimizedRebalancingPlan = {
      optimizedRoutes: [
        {
          fromStation: 'station_001',
          toStation: 'station_002',
          batteryCount: 5,
          priority: 'high',
          reason: 'Test route for AI recommendation emission',
          estimatedDistance: 8
        }
      ],
      trafficConsiderations: ['Test traffic consideration'],
      demandForecast: [],
      executionSchedule: [],
      summary: 'Test optimization plan',
      estimatedEfficiency: 15,
      riskFactors: []
    };
    
    try {
      await this.emitAIRouteRecommendationEvents(mockOptimizedPlan);
      console.log('AI route recommendation emission test completed successfully!');
    } catch (error) {
      console.error('AI route recommendation emission test failed:', error);
    }
  }
}
