import {JSONValue, TypedMap, JSONValueKind, ValueKind, Value, log, near} from "@graphprotocol/graph-ts";
import {User} from "../generated/schema";


export function typedMapToString(typedMap: TypedMap<string, JSONValue>): string {
    let string = "{"
    for (let i = 0; i < typedMap.entries.length; i++) {
        let value = typedMap.entries[i].value
        let stringValue: string;
        switch (value.kind) {
            case JSONValueKind.STRING:
                stringValue = value.toString()
                break
            case JSONValueKind.OBJECT:
                stringValue = typedMapToString(value.toObject())
                break
            case JSONValueKind.ARRAY:
                stringValue = value.toArray().toString()
                break
            case JSONValueKind.BOOL:
                stringValue = value.toBool().toString()
                break
            case JSONValueKind.NUMBER:
                stringValue = value.toI64().toString()
        }

        if (typedMap.entries[i].value.isNull())
            stringValue = "null"
        string += `"${typedMap.entries[i].key}": ${stringValue!}`
        if (i != typedMap.entries.length - 1)
            string += ", "
    }
    string += "}"
    return string
}

export function deleteObjFromArray<T>(array: T[], str: T): T[] {
    const index = array.indexOf(str)
    if (index > -1) {
        array.splice(index, 1)
    }
    return array
}

export function addObjToArray<T>(array: T[] | null, obj: T): T[] {
    if (array == null) {
        array = new Array<T>()
    }
    array.push(obj)
    return array
}

export function getOrCreateUser(accountId: string): User {
    const user = User.load(accountId)
    if (user == null) {
        const newUser = new User(accountId)
        newUser.points = 0
        newUser.wins = 0
        newUser.wins_in_line = 0
        newUser.games = 0
        newUser.players_sold = 0
        newUser.referrals_count = 0
        newUser.friends_count = 0
        newUser.already_set_team = false
        return newUser
    }
    return user as User
}

export function validateActionFunctionCall(action: near.ActionValue, callingMethodName: string, contractMethod: string): boolean {
    if (action.kind != near.ActionKind.FUNCTION_CALL) {
        log.error(`${callingMethodName}: action is not a function call`, []);
        return false;
    }

    const methodName = action.toFunctionCall().methodName

    if (!(methodName == contractMethod)) {
        log.error("handleNFTBuyPack: Invalid method name: {}", [methodName]);
        return false
    }
    return true
}
