import {json, JSONValue, JSONValueKind, log, near, TypedMap} from "@graphprotocol/graph-ts";
import {TAKING_PART_IN_GAME_POINTS, WINNING_GAME_POINTS} from "./constants";
import {getOrCreateUser} from "./utils";
import {validateActionFunctionCall} from "./utils";

export function handleOnGetTeam (
    action: near.ActionValue,
    receiptWithOutcome: near.ReceiptWithOutcome
): void {
    // preparing and validating
    validateActionFunctionCall(action, "handleOnGetTeam", "on_get_team")
    // main logic
    let returnedValue: TypedMap<string, JSONValue>;
    if (receiptWithOutcome.outcome.status.kind == near.SuccessStatusKind.VALUE) {
        const returnBytes = receiptWithOutcome.outcome.status.toValue().toString()
        if (returnBytes == "null" || returnBytes == "false" || returnBytes == "true") {
            return
        }
        returnedValue = json.fromString(returnBytes.toString()).toObject()
    } else {
        log.error("handleOnGetTeam: outcome.status.kind is not a value", [])
        return
    }

    const user1 = getOrCreateUser(returnedValue.get("user1")!.toObject().get("account_id")!.toString())
    const user2 = getOrCreateUser(returnedValue.get("user2")!.toObject().get("account_id")!.toString())
    user1.points += TAKING_PART_IN_GAME_POINTS
    user2.points += TAKING_PART_IN_GAME_POINTS
    user1.games += 1
    user2.games += 1
    user1.save()
    user2.save()
}

export function handleGenerateEvent(
    action: near.ActionValue,
    receiptWithOutcome: near.ReceiptWithOutcome
): void {
    // preparing and validating
    validateActionFunctionCall(action, "handleGenerateEvent", "generate_event")
    // main logic

    let returnedValuesArray: Array<JSONValue>;
    if (receiptWithOutcome.outcome.status.kind == near.SuccessStatusKind.VALUE) {
        const returnBytes = receiptWithOutcome.outcome.status.toValue()
        if (returnBytes.toString() == "null") {
            return
        }
        returnedValuesArray = json.fromString(returnBytes.toString()).toArray()
    } else {
        log.error("handleGenerateEvent: outcome.status.kind is not a value", [])
        return
    }
    for (let i = 0; i < returnedValuesArray.length; i++) {
        const eventData = returnedValuesArray[i].toObject()
        const action = eventData.get("action")!.toString()
        if (action == "GameFinished") {
            const logs = receiptWithOutcome.outcome.logs
            let winnerLog: Array<JSONValue> = []
            for (let i = 0; i < logs.length; i++) {
                const tryLog = json.try_fromString(logs[i].toString())
                if (tryLog.isOk) {
                    if (json.fromString(logs[i]).kind == JSONValueKind.ARRAY) {
                        winnerLog = json.fromString(logs[i]).toArray()
                        break
                    }
                }
            }
            if (winnerLog.length == 0) {
                log.error("handleGenerateEvent: No winner log", [])
                return
            }
            // const winnerId = eventData.get("winner_id")!.toString()
            const winnerId = winnerLog[1].toArray()[0].toString()
            const winner = getOrCreateUser(winnerId)
            winner.wins += 1
            winner.wins_in_line += 1
            if (winner.wins_in_line > winner.max_wins_in_line) {
                winner.max_wins_in_line = winner.wins_in_line
            }
            winner.points += WINNING_GAME_POINTS
            winner.save()

            const user1AccountId = eventData.get("user1")!.toObject().get("account_id")!.toString()
            const user2AccountId = eventData.get("user2")!.toObject().get("account_id")!.toString()
            const looserId = user1AccountId == winnerId ? user2AccountId : user1AccountId
            const looser = getOrCreateUser(looserId)
            looser.wins_in_line = 0
            looser.save()
        }
    }
}

export function handleAcceptFriendRequest(
    action: near.ActionValue,
    receiptWithOutcome: near.ReceiptWithOutcome
): void {
    validateActionFunctionCall(action, "handleAcceptFriendRequest", "accept_friend_request")
    const functionCall = action.toFunctionCall()
    const args = json.fromString(functionCall.args.toString()).toObject()
    const friendId = args.get("friend_id")!.toString()
    const account = receiptWithOutcome.receipt.signerId
    const friend = getOrCreateUser(friendId)
    const user = getOrCreateUser(account)
    friend.friends_count += 1
    user.friends_count += 1
    friend.save()
    user.save()
}