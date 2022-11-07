import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import {
  PromiEvent,
  TransactionReceipt,
  EventResponse,
  EventData,
  Web3ContractContext,
} from 'ethereum-abi-types-generator';
import { ContractSendMethod } from 'web3-eth-contract';

export interface CallOptions {
  from?: string;
  gasPrice?: string;
  gas?: number;
}

export interface SendOptions {
  from: string;
  value?: number | string | BN | BigNumber;
  gasPrice?: string;
  gas?: number;
}

export interface EstimateGasOptions {
  from?: string;
  value?: number | string | BN | BigNumber;
  gas?: number;
}

export interface MethodPayableReturnContext extends ContractSendMethod {}

export interface MethodConstantReturnContext<TCallReturn> {
  call(): Promise<TCallReturn>;
  call(options: CallOptions): Promise<TCallReturn>;
  call(options: CallOptions, callback: (error: Error, result: TCallReturn) => void): Promise<TCallReturn>;
  encodeABI(): string;
}

export interface MethodReturnContext extends MethodPayableReturnContext {}

export type ContractContext = Web3ContractContext<
  NftContract,
  NftContractMethodNames,
  NftContractEventsContext,
  NftContractEvents
>;
export type NftContractEvents =
  | 'Approval'
  | 'ApprovalForAll'
  | 'BaseURIChanged'
  | 'OwnershipTransferred'
  | 'SmartContractAllowanceChanged'
  | 'SupplyLimitChanged'
  | 'TicketAddressChanged'
  | 'TogglePresaleState'
  | 'ToggleSaleState'
  | 'ToggleWhitelistSaleState'
  | 'Transfer'
  | 'WhiteListAdded'
  | 'WhitelistBuy'
  | 'WhitelistStatusChanged'
  | 'WithdrawalWalletChanged';
export interface NftContractEventsContext {
  Approval(
    parameters: {
      filter?: { owner?: string | string[]; approved?: string | string[]; tokenId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  ApprovalForAll(
    parameters: {
      filter?: { owner?: string | string[]; operator?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  BaseURIChanged(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  OwnershipTransferred(
    parameters: {
      filter?: { previousOwner?: string | string[]; newOwner?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  SmartContractAllowanceChanged(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  SupplyLimitChanged(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  TicketAddressChanged(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  TogglePresaleState(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  ToggleSaleState(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  ToggleWhitelistSaleState(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  Transfer(
    parameters: {
      filter?: { from?: string | string[]; to?: string | string[]; tokenId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  WhiteListAdded(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  WhitelistBuy(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  WhitelistStatusChanged(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  WithdrawalWalletChanged(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
}
export type NftContractMethodNames =
  | 'new'
  | 'approve'
  | 'buyFree'
  | 'buyLegendary'
  | 'buyUltraRare'
  | 'changeSupplyLimit'
  | 'editMintPriceLegendary'
  | 'editMintPriceUltraRare'
  | 'editSaleRestrictions'
  | 'mintTo'
  | 'mintToPrivate'
  | 'removeLimitAddress'
  | 'renounceOwnership'
  | 'reserve'
  | 'safeTransferFrom'
  | 'safeTransferFrom'
  | 'setApprovalForAll'
  | 'setBaseURI'
  | 'setSmartContractAllowance'
  | 'setWhitelistFree'
  | 'setWhitelistLegendary'
  | 'setWhitelistUltraRare'
  | 'setWithdrawalWallet'
  | 'toggleSaleActive'
  | 'toggleSaleFree'
  | 'toggleSaleLegendary'
  | 'toggleSaleUltraRare'
  | 'toggleWhitelistFree'
  | 'toggleWhitelistLegendary'
  | 'toggleWhitelistUltraRare'
  | 'transferFrom'
  | 'transferOwnership'
  | 'withdraw'
  | 'balanceOf'
  | 'baseURI'
  | 'getApproved'
  | 'isApprovedForAll'
  | 'maxSupplyFree'
  | 'maxSupplyLegendary'
  | 'maxSupplyUltraRare'
  | 'maxTxPublic'
  | 'maxTxWL'
  | 'merkleRootFree'
  | 'merkleRootLegendary'
  | 'merkleRootUltraRare'
  | 'mintPrice'
  | 'mintPriceLegendary'
  | 'mintPriceUltraRare'
  | 'name'
  | 'nftTotalSupply'
  | 'owner'
  | 'ownerOf'
  | 'purchaseTxsFree'
  | 'purchaseTxsUltraRare'
  | 'saleActive'
  | 'saleActiveFree'
  | 'saleActiveLegendary'
  | 'saleActiveUltraRare'
  | 'smartContractAllowance'
  | 'supplyLimit'
  | 'supportsInterface'
  | 'symbol'
  | 'tokenURI'
  | 'totalSupply'
  | 'totalSupplyFree'
  | 'totalSupplyLegendary'
  | 'totalSupplyUltraRare'
  | 'whitelistActive'
  | 'whitelistActiveFree'
  | 'whitelistActiveLegendary'
  | 'whitelistActiveUltraRare'
  | 'whitelistSaleActive'
  | 'withdrawalWallet';
export interface ApprovalEventEmittedResponse {
  owner: string;
  approved: string;
  tokenId: string;
}
export interface ApprovalForAllEventEmittedResponse {
  owner: string;
  operator: string;
  approved: boolean;
}
export interface BaseURIChangedEventEmittedResponse {
  _baseURI: string;
}
export interface OwnershipTransferredEventEmittedResponse {
  previousOwner: string;
  newOwner: string;
}
export interface SmartContractAllowanceChangedEventEmittedResponse {
  _newSmartContractAllowance: boolean;
}
export interface SupplyLimitChangedEventEmittedResponse {
  _supplyLimit: string;
}
export interface TicketAddressChangedEventEmittedResponse {
  _ticketAddress: string;
}
export interface TogglePresaleStateEventEmittedResponse {
  _preSaleState: boolean;
}
export interface ToggleSaleStateEventEmittedResponse {
  _state: boolean;
}
export interface ToggleWhitelistSaleStateEventEmittedResponse {
  _whitelistSaleActive: boolean;
}
export interface TransferEventEmittedResponse {
  from: string;
  to: string;
  tokenId: string;
}
export interface WhiteListAddedEventEmittedResponse {
  _user: string;
  _status: boolean;
}
export interface WhitelistBuyEventEmittedResponse {
  _user: string;
  _amount: string;
}
export interface WhitelistStatusChangedEventEmittedResponse {
  _user: string;
  _status: boolean;
}
export interface WithdrawalWalletChangedEventEmittedResponse {
  _newWithdrawalWallet: string;
}
export interface NftContract {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: constructor
   * @param _supplyLimit Type: uint256, Indexed: false
   * @param _mintPrice Type: uint256, Indexed: false
   * @param _withdrawalWallet Type: address, Indexed: false
   * @param _name Type: string, Indexed: false
   * @param _ticker Type: string, Indexed: false
   * @param _baseURI Type: string, Indexed: false
   */
  'new'(
    _supplyLimit: string,
    _mintPrice: string,
    _withdrawalWallet: string,
    _name: string,
    _ticker: string,
    _baseURI: string,
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param to Type: address, Indexed: false
   * @param tokenId Type: uint256, Indexed: false
   */
  approve(to: string, tokenId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _amount Type: uint256, Indexed: false
   * @param merkleProof Type: bytes32[], Indexed: false
   */
  buyFree(_amount: string, merkleProof: string | number[][]): MethodReturnContext;
  /**
   * Payable: true
   * Constant: false
   * StateMutability: payable
   * Type: function
   * @param _amount Type: uint256, Indexed: false
   */
  buyLegendary(_amount: string): MethodPayableReturnContext;
  /**
   * Payable: true
   * Constant: false
   * StateMutability: payable
   * Type: function
   * @param _amount Type: uint256, Indexed: false
   * @param merkleProof Type: bytes32[], Indexed: false
   */
  buyUltraRare(_amount: string, merkleProof: string | number[][]): MethodPayableReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _supplyLimit Type: uint256, Indexed: false
   */
  changeSupplyLimit(_supplyLimit: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _price Type: uint256, Indexed: false
   */
  editMintPriceLegendary(_price: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _price Type: uint256, Indexed: false
   */
  editMintPriceUltraRare(_price: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _maxTxPublic Type: uint8, Indexed: false
   */
  editSaleRestrictions(_maxTxPublic: string | number): MethodReturnContext;
  /**
   * Payable: true
   * Constant: false
   * StateMutability: payable
   * Type: function
   * @param to Type: address, Indexed: false
   * @param _count Type: uint256, Indexed: false
   */
  mintTo(to: string, _count: string): MethodPayableReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param to Type: address, Indexed: false
   * @param _count Type: uint256, Indexed: false
   */
  mintToPrivate(to: string, _count: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _address Type: address, Indexed: false
   */
  removeLimitAddress(_address: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  renounceOwnership(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _amount Type: uint256, Indexed: false
   */
  reserve(_amount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param from Type: address, Indexed: false
   * @param to Type: address, Indexed: false
   * @param tokenId Type: uint256, Indexed: false
   */
  safeTransferFrom(from: string, to: string, tokenId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param from Type: address, Indexed: false
   * @param to Type: address, Indexed: false
   * @param tokenId Type: uint256, Indexed: false
   * @param _data Type: bytes, Indexed: false
   */
  safeTransferFrom(from: string, to: string, tokenId: string, _data: string | number[]): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param operator Type: address, Indexed: false
   * @param approved Type: bool, Indexed: false
   */
  setApprovalForAll(operator: string, approved: boolean): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _baseURI Type: string, Indexed: false
   */
  setBaseURI(_baseURI: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _smartContractAllowance Type: bool, Indexed: false
   */
  setSmartContractAllowance(_smartContractAllowance: boolean): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _merkleRoot Type: bytes32, Indexed: false
   */
  setWhitelistFree(_merkleRoot: string | number[]): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _merkleRoot Type: bytes32, Indexed: false
   */
  setWhitelistLegendary(_merkleRoot: string | number[]): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _merkleRoot Type: bytes32, Indexed: false
   */
  setWhitelistUltraRare(_merkleRoot: string | number[]): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _withdrawalWallet Type: address, Indexed: false
   */
  setWithdrawalWallet(_withdrawalWallet: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  toggleSaleActive(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  toggleSaleFree(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  toggleSaleLegendary(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  toggleSaleUltraRare(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  toggleWhitelistFree(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  toggleWhitelistLegendary(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  toggleWhitelistUltraRare(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param from Type: address, Indexed: false
   * @param to Type: address, Indexed: false
   * @param tokenId Type: uint256, Indexed: false
   */
  transferFrom(from: string, to: string, tokenId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newOwner Type: address, Indexed: false
   */
  transferOwnership(newOwner: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  withdraw(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param owner Type: address, Indexed: false
   */
  balanceOf(owner: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  baseURI(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param tokenId Type: uint256, Indexed: false
   */
  getApproved(tokenId: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param owner Type: address, Indexed: false
   * @param operator Type: address, Indexed: false
   */
  isApprovedForAll(owner: string, operator: string): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  maxSupplyFree(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  maxSupplyLegendary(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  maxSupplyUltraRare(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  maxTxPublic(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  maxTxWL(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  merkleRootFree(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  merkleRootLegendary(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  merkleRootUltraRare(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  mintPrice(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  mintPriceLegendary(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  mintPriceUltraRare(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  name(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  nftTotalSupply(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  owner(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param tokenId Type: uint256, Indexed: false
   */
  ownerOf(tokenId: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   */
  purchaseTxsFree(parameter0: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   */
  purchaseTxsUltraRare(parameter0: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  saleActive(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  saleActiveFree(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  saleActiveLegendary(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  saleActiveUltraRare(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  smartContractAllowance(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  supplyLimit(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param interfaceId Type: bytes4, Indexed: false
   */
  supportsInterface(interfaceId: string | number[]): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  symbol(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _tokenId Type: uint256, Indexed: false
   */
  tokenURI(_tokenId: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  totalSupply(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  totalSupplyFree(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  totalSupplyLegendary(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  totalSupplyUltraRare(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  whitelistActive(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  whitelistActiveFree(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  whitelistActiveLegendary(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  whitelistActiveUltraRare(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  whitelistSaleActive(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  withdrawalWallet(): MethodConstantReturnContext<string>;
}
