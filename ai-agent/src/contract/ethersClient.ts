import { ethers } from 'ethers';
import { config } from '../config';

export class EthersClient {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(): Promise<void> {
    try {
      // Create provider for SEI network
      this.provider = new ethers.JsonRpcProvider(config.sei.rpcUrl);
      
      // Create wallet from private key
      this.wallet = new ethers.Wallet(config.wallet.privateKey, this.provider);
      
      // Create signer
      this.signer = this.wallet.connect(this.provider);

      console.log('Ethers client initialized successfully');
      console.log(`Connected to network: ${config.sei.rpcUrl}`);
      console.log(`Wallet address: ${this.wallet.address}`);
    } catch (error) {
      console.error('Failed to initialize ethers client:', error);
      throw error;
    }
  }

  async getProvider(): Promise<ethers.JsonRpcProvider> {
    if (!this.provider) {
      throw new Error('Ethers provider not initialized');
    }
    return this.provider;
  }

  async getWallet(): Promise<ethers.Wallet> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet;
  }

  async getSigner(): Promise<ethers.Signer> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return this.signer;
  }

  async getAccountBalance(address: string): Promise<string> {
    try {
      const provider = await this.getProvider();
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  async getAccountAddress(): Promise<string> {
    try {
      const wallet = await this.getWallet();
      return wallet.address;
    } catch (error) {
      console.error('Failed to get account address:', error);
      throw error;
    }
  }

  async getNetwork(): Promise<ethers.Network> {
    try {
      const provider = await this.getProvider();
      return await provider.getNetwork();
    } catch (error) {
      console.error('Failed to get network:', error);
      throw error;
    }
  }

  async getCurrentBlockNumber(): Promise<number> {
    try {
      const provider = await this.getProvider();
      return await provider.getBlockNumber();
    } catch (error) {
      console.error('Failed to get current block number:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Ethers doesn't require explicit disconnection
    // But we can clean up references
    this.provider = null;
    this.wallet = null;
    this.signer = null;
  }
}
