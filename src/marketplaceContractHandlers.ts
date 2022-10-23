import { json, JSONValue, log, near, TypedMap } from "@graphprotocol/graph-ts";
import { getOrCreateUser } from "./utils";
import { NFT_BUY_PACK_POINTS, NFT_BUY_POINTS, NFT_SELL_POINTS } from "./constants";
import { validateActionFunctionCall } from "./utils";

export function handleNFTBuyPack (
    action: near.ActionValue,
    receiptWithOutcome: near.ReceiptWithOutcome
): void {
    // preparing and validating
    validateActionFunctionCall(action, "handleNFTBuyPack", "nft_buy_pack")

    const functionCall = action.toFunctionCall();
    // main logic

    const args = json.fromString(functionCall.args.toString()).toObject();

    const user = getOrCreateUser(args.get("receiver_id")!.toString())
    user.points += NFT_BUY_PACK_POINTS
    user.save()
}

export function handleResolvePurchase (
    action: near.ActionValue,
    receiptWithOutcome: near.ReceiptWithOutcome
): void {
    // preparing and validating
    validateActionFunctionCall(action, "handleResolvePurchase", "resolve_purchase")

    const functionCall = action.toFunctionCall();
    // main logic

    const args = json.fromString(functionCall.args.toString()).toObject();

    let ownerId: string | null = null
    let buyerId: string | null = null
    const logs = receiptWithOutcome.outcome!.logs
    for (let i = 0; i < logs.length; i++) {
        if (!json.try_fromString(logs[i].toString()).isOk) {
            continue
        }
        const log = json.fromString(logs[i]).toObject()
        if (log.get("owner_id") == null) {
            continue
        }
        ownerId = log.get("owner_id")!.toString()
        buyerId = log.get("buyer_id")!.toString()
    }
    if (ownerId == null || buyerId == null) {
        log.error("handleResolvePurchase: ownerId or buyerId is null", [])
        return
    }

    const owner = getOrCreateUser(ownerId)
    const buyer = getOrCreateUser(buyerId)
    owner.points += NFT_SELL_POINTS
    buyer.points += NFT_BUY_POINTS
    owner.save()
    buyer.save()
}
