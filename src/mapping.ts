import {near, BigInt, log, TypedMap, JSONValue, json, JSONValueKind} from "@graphprotocol/graph-ts"
import {handleOnGetTeam, handleGenerateEvent} from "./gameContractHandlers";
import { handleNFTBuyPack, handleResolvePurchase } from "./marketplaceContractHandlers";


export function mapGameReceipt(
    receiptWithOutcome: near.ReceiptWithOutcome
): void {
    const actions = receiptWithOutcome.receipt.actions;
    for (let i = 0; i < actions.length; i++) {
        if (actions[i].kind != near.ActionKind.FUNCTION_CALL) {
            continue
        }
        const functionCall = actions[i].toFunctionCall();
        if (functionCall.methodName == "on_get_team")
            handleOnGetTeam(actions[i], receiptWithOutcome)
        if (functionCall.methodName == "generate_event")
            handleGenerateEvent(actions[i], receiptWithOutcome)
        else
            log.info("handleReceipt: Invalid method name: {}", [functionCall.methodName])
    }
}

export function mapMarketplaceReceipt(
    receiptWithOutcome: near.ReceiptWithOutcome
): void {
    const actions = receiptWithOutcome.receipt.actions;
    for (let i = 0; i < actions.length; i++) {
        if (actions[i].kind != near.ActionKind.FUNCTION_CALL) {
            continue
        }
        const functionCall = actions[i].toFunctionCall();
        if (functionCall.methodName == "nft_buy_pack")
            handleNFTBuyPack(actions[i], receiptWithOutcome)
        if (functionCall.methodName == "resolve_purchase")
            handleResolvePurchase(actions[i], receiptWithOutcome)
        else
            log.info("handleReceipt: Invalid method name: {}", [functionCall.methodName])
    }
}
