// Contract addresses and ABIs for Bouncccer on Arbitrum Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";

export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// Contract addresses on different networks
export const CONTRACT_ADDRESSES: Record<number, { Quinty: string; QuintyNFT: string; QuintyReputation: string }> = {
  [MANTLE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0x5418fc891317C20f923ccB431d9B040D14987bD8",
    QuintyNFT: "0x7F3AC11808D1ADd56Abe48603D7ee16cAB970060",
    QuintyReputation: "0x32e26c6880e652599A20CF8eb672FDd9179114FC",
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0xA7b8202E50814DC6D54af891F90995947a3a3d29",
    QuintyNFT: "0x15Dd08664fC28BD87C16F4481a96d3CC56f5B6D0",
    QuintyReputation: "0xad91D6E288aB5463fe722E94e587111556a455eA",
  },
  [ARBITRUM_SEPOLIA_CHAIN_ID]: {
    Quinty: "0xd2AC810cFDCC68B6297a34b9754E4FF0335FE4af",
    QuintyNFT: "0xBe17D9c0221b51E02ba0a131CB417D301724853a",
    QuintyReputation: "0x4D3ACbAFCd1fc9BaCF1aaFEbb903B85552a2a0fb",
  },
};

// Export ABIs
export const QUINTY_ABI = QuintyABI.abi;
export const QUINTY_NFT_ABI = QuintyNFTABI.abi;
export const REPUTATION_ABI = QuintyReputationABI.abi;

// Enums from contracts
export enum BountyStatus {
  OPREC = 0,
  OPEN = 1,
  PENDING_REVEAL = 2,
  RESOLVED = 3,
  EXPIRED = 4,
}

export enum BadgeType {
  BountyCreator = 0,
  BountySolver = 1,
  TeamMember = 2,
}

// Explorer URLs
export const EXPLORERS: Record<number, string> = {
  [MANTLE_SEPOLIA_CHAIN_ID]: "https://sepolia.mantlescan.xyz",
  [BASE_SEPOLIA_CHAIN_ID]: "https://sepolia.basescan.org",
  [ARBITRUM_SEPOLIA_CHAIN_ID]: "https://sepolia.arbiscan.io",
};

// Helper function to get contract address
export function getContractAddress(contractName: "Quinty" | "QuintyNFT" | "QuintyReputation", chainId: number = ARBITRUM_SEPOLIA_CHAIN_ID): string {
  return CONTRACT_ADDRESSES[chainId]?.[contractName] || CONTRACT_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID][contractName];
}

// Helper to get explorer URL
export function getExplorerUrl(addressOrTx: string, chainId: number = ARBITRUM_SEPOLIA_CHAIN_ID, type: 'address' | 'tx' = 'address'): string {
  const explorer = EXPLORERS[chainId] || EXPLORERS[ARBITRUM_SEPOLIA_CHAIN_ID];
  return `${explorer}/${type}/${addressOrTx}`;
}
