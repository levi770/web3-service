import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { PromiEvent, TransactionReceipt, EventResponse, EventData, Web3ContractContext } from 'ethereum-abi-types-generator';
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
export interface MethodPayableReturnContext {
    send(options: SendOptions): PromiEvent<TransactionReceipt>;
    send(options: SendOptions, callback: (error: Error, result: any) => void): PromiEvent<TransactionReceipt>;
    estimateGas(options: EstimateGasOptions): Promise<number>;
    estimateGas(options: EstimateGasOptions, callback: (error: Error, result: any) => void): Promise<number>;
    encodeABI(): string;
}
export interface MethodConstantReturnContext<TCallReturn> {
    call(): Promise<TCallReturn>;
    call(options: CallOptions): Promise<TCallReturn>;
    call(options: CallOptions, callback: (error: Error, result: TCallReturn) => void): Promise<TCallReturn>;
    encodeABI(): string;
}
export interface MethodReturnContext extends MethodPayableReturnContext {
}
export declare type ContractContext = Web3ContractContext<NftContract, NftContractMethodNames, NftContractEventsContext, NftContractEvents>;
export declare type NftContractEvents = 'Approval' | 'ApprovalForAll' | 'BaseURIChanged' | 'OwnershipTransferred' | 'SmartContractAllowanceChanged' | 'SupplyLimitChanged' | 'TicketAddressChanged' | 'TogglePresaleState' | 'ToggleSaleState' | 'ToggleWhitelistSaleState' | 'Transfer' | 'WhiteListAdded' | 'WhitelistBuy' | 'WhitelistStatusChanged' | 'WithdrawalWalletChanged';
export interface NftContractEventsContext {
    Approval(parameters: {
        filter?: {
            owner?: string | string[];
            approved?: string | string[];
            tokenId?: string | string[];
        };
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    ApprovalForAll(parameters: {
        filter?: {
            owner?: string | string[];
            operator?: string | string[];
        };
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    BaseURIChanged(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    OwnershipTransferred(parameters: {
        filter?: {
            previousOwner?: string | string[];
            newOwner?: string | string[];
        };
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    SmartContractAllowanceChanged(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    SupplyLimitChanged(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    TicketAddressChanged(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    TogglePresaleState(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    ToggleSaleState(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    ToggleWhitelistSaleState(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    Transfer(parameters: {
        filter?: {
            from?: string | string[];
            to?: string | string[];
            tokenId?: string | string[];
        };
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    WhiteListAdded(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    WhitelistBuy(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    WhitelistStatusChanged(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
    WithdrawalWalletChanged(parameters: {
        filter?: {};
        fromBlock?: number;
        toBlock?: 'latest' | number;
        topics?: string[];
    }, callback?: (error: Error, event: EventData) => void): EventResponse;
}
export declare type NftContractMethodNames = 'new' | 'approve' | 'buyFree' | 'buyLegendary' | 'buyUltraRare' | 'changeSupplyLimit' | 'editMintPriceLegendary' | 'editMintPriceUltraRare' | 'editSaleRestrictions' | 'mintTo' | 'mintToPrivate' | 'removeLimitAddress' | 'renounceOwnership' | 'reserve' | 'safeTransferFrom' | 'safeTransferFrom' | 'setApprovalForAll' | 'setBaseURI' | 'setSmartContractAllowance' | 'setWhitelistFree' | 'setWhitelistLegendary' | 'setWhitelistUltraRare' | 'setWithdrawalWallet' | 'toggleSaleActive' | 'toggleSaleFree' | 'toggleSaleLegendary' | 'toggleSaleUltraRare' | 'toggleWhitelistFree' | 'toggleWhitelistLegendary' | 'toggleWhitelistUltraRare' | 'transferFrom' | 'transferOwnership' | 'withdraw' | 'balanceOf' | 'baseURI' | 'getApproved' | 'isApprovedForAll' | 'maxSupplyFree' | 'maxSupplyLegendary' | 'maxSupplyUltraRare' | 'maxTxPublic' | 'maxTxWL' | 'merkleRootFree' | 'merkleRootLegendary' | 'merkleRootUltraRare' | 'mintPrice' | 'mintPriceLegendary' | 'mintPriceUltraRare' | 'name' | 'nftTotalSupply' | 'owner' | 'ownerOf' | 'purchaseTxsFree' | 'purchaseTxsUltraRare' | 'saleActive' | 'saleActiveFree' | 'saleActiveLegendary' | 'saleActiveUltraRare' | 'smartContractAllowance' | 'supplyLimit' | 'supportsInterface' | 'symbol' | 'tokenURI' | 'totalSupply' | 'totalSupplyFree' | 'totalSupplyLegendary' | 'totalSupplyUltraRare' | 'whitelistActive' | 'whitelistActiveFree' | 'whitelistActiveLegendary' | 'whitelistActiveUltraRare' | 'whitelistSaleActive' | 'withdrawalWallet';
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
    'new'(_supplyLimit: string, _mintPrice: string, _withdrawalWallet: string, _name: string, _ticker: string, _baseURI: string): MethodReturnContext;
    approve(to: string, tokenId: string): MethodReturnContext;
    buyFree(_amount: string, merkleProof: string | number[][]): MethodReturnContext;
    buyLegendary(_amount: string): MethodPayableReturnContext;
    buyUltraRare(_amount: string, merkleProof: string | number[][]): MethodPayableReturnContext;
    changeSupplyLimit(_supplyLimit: string): MethodReturnContext;
    editMintPriceLegendary(_price: string): MethodReturnContext;
    editMintPriceUltraRare(_price: string): MethodReturnContext;
    editSaleRestrictions(_maxTxPublic: string | number): MethodReturnContext;
    mintTo(to: string, _count: string): MethodPayableReturnContext;
    mintToPrivate(to: string, _count: string): MethodReturnContext;
    removeLimitAddress(_address: string): MethodReturnContext;
    renounceOwnership(): MethodReturnContext;
    reserve(_amount: string): MethodReturnContext;
    safeTransferFrom(from: string, to: string, tokenId: string): MethodReturnContext;
    safeTransferFrom(from: string, to: string, tokenId: string, _data: string | number[]): MethodReturnContext;
    setApprovalForAll(operator: string, approved: boolean): MethodReturnContext;
    setBaseURI(_baseURI: string): MethodReturnContext;
    setSmartContractAllowance(_smartContractAllowance: boolean): MethodReturnContext;
    setWhitelistFree(_merkleRoot: string | number[]): MethodReturnContext;
    setWhitelistLegendary(_merkleRoot: string | number[]): MethodReturnContext;
    setWhitelistUltraRare(_merkleRoot: string | number[]): MethodReturnContext;
    setWithdrawalWallet(_withdrawalWallet: string): MethodReturnContext;
    toggleSaleActive(): MethodReturnContext;
    toggleSaleFree(): MethodReturnContext;
    toggleSaleLegendary(): MethodReturnContext;
    toggleSaleUltraRare(): MethodReturnContext;
    toggleWhitelistFree(): MethodReturnContext;
    toggleWhitelistLegendary(): MethodReturnContext;
    toggleWhitelistUltraRare(): MethodReturnContext;
    transferFrom(from: string, to: string, tokenId: string): MethodReturnContext;
    transferOwnership(newOwner: string): MethodReturnContext;
    withdraw(): MethodReturnContext;
    balanceOf(owner: string): MethodConstantReturnContext<string>;
    baseURI(): MethodConstantReturnContext<string>;
    getApproved(tokenId: string): MethodConstantReturnContext<string>;
    isApprovedForAll(owner: string, operator: string): MethodConstantReturnContext<boolean>;
    maxSupplyFree(): MethodConstantReturnContext<string>;
    maxSupplyLegendary(): MethodConstantReturnContext<string>;
    maxSupplyUltraRare(): MethodConstantReturnContext<string>;
    maxTxPublic(): MethodConstantReturnContext<string>;
    maxTxWL(): MethodConstantReturnContext<string>;
    merkleRootFree(): MethodConstantReturnContext<string>;
    merkleRootLegendary(): MethodConstantReturnContext<string>;
    merkleRootUltraRare(): MethodConstantReturnContext<string>;
    mintPrice(): MethodConstantReturnContext<string>;
    mintPriceLegendary(): MethodConstantReturnContext<string>;
    mintPriceUltraRare(): MethodConstantReturnContext<string>;
    name(): MethodConstantReturnContext<string>;
    nftTotalSupply(): MethodConstantReturnContext<string>;
    owner(): MethodConstantReturnContext<string>;
    ownerOf(tokenId: string): MethodConstantReturnContext<string>;
    purchaseTxsFree(parameter0: string): MethodConstantReturnContext<string>;
    purchaseTxsUltraRare(parameter0: string): MethodConstantReturnContext<string>;
    saleActive(): MethodConstantReturnContext<boolean>;
    saleActiveFree(): MethodConstantReturnContext<boolean>;
    saleActiveLegendary(): MethodConstantReturnContext<boolean>;
    saleActiveUltraRare(): MethodConstantReturnContext<boolean>;
    smartContractAllowance(): MethodConstantReturnContext<boolean>;
    supplyLimit(): MethodConstantReturnContext<string>;
    supportsInterface(interfaceId: string | number[]): MethodConstantReturnContext<boolean>;
    symbol(): MethodConstantReturnContext<string>;
    tokenURI(_tokenId: string): MethodConstantReturnContext<string>;
    totalSupply(): MethodConstantReturnContext<string>;
    totalSupplyFree(): MethodConstantReturnContext<string>;
    totalSupplyLegendary(): MethodConstantReturnContext<string>;
    totalSupplyUltraRare(): MethodConstantReturnContext<string>;
    whitelistActive(): MethodConstantReturnContext<boolean>;
    whitelistActiveFree(): MethodConstantReturnContext<boolean>;
    whitelistActiveLegendary(): MethodConstantReturnContext<boolean>;
    whitelistActiveUltraRare(): MethodConstantReturnContext<boolean>;
    whitelistSaleActive(): MethodConstantReturnContext<boolean>;
    withdrawalWallet(): MethodConstantReturnContext<string>;
}
