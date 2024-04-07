//
//  ExternalData.swift
//  MealPrep
//
//  Created by Zhi Tan on 7/3/23.
//

import Foundation
import NWWebSocket
import Network

struct StickyJSON: Codable {
    var title: String
    var content: String
    var notificationSoundID: Int?
    var instructions: [String]
}

struct IncomingMsg: Codable {
    var action: String
    var id: String
    var msg: StickyJSON?
}

struct ResponseMsg: Codable {
    var response: String
}


class ExternalDataManager : WebSocketConnectionDelegate{
    var lastData : String = ""
    var socket : NWWebSocket? = nil
    var stickyData: StickyData
    var connected: Bool = false

    init(stickyData: StickyData){
        self.stickyData = stickyData
        let socketURL = URL(string: "https://z.ngrok.dev")
        self.socket = NWWebSocket(url: socketURL!)
        self.socket?.delegate = self
    }
    
    func connect_and_initialize(){
        // connet to server if not connetected
        print("in connect and intialize")
        if (!self.connected){
            self.socket?.connect()
            self.socket?.listen()
            // send the initial code
            self.socket?.send(string: "{\"type\": \"init\",\"secret\":\"qyPDrj5yxq6rUHbwHbpTR8CXJVRFWRSU\",\"role\": \"client\",\"home_key\": \"ep6\"}")
        }
    }
    
    func disconnect(){
        //gracefully disconnect
        self.socket?.disconnect(closeCode: .protocolCode(.normalClosure))
        self.connected = false
        self.stickyData.connected = false
        print("external data disconnected.")
    }
        
    func webSocketDidConnect(connection: WebSocketConnection) {
        print("connected")
        // Respond to a WebSocket connection event
    }

    func webSocketDidDisconnect(connection: WebSocketConnection,
                                closeCode: NWProtocolWebSocket.CloseCode, reason: Data?) {
        print("failed \(closeCode)")
        print(reason!)
        self.connected = false
        self.stickyData.connected = false
        // Respond to a WebSocket disconnection event
    }

    func webSocketViabilityDidChange(connection: WebSocketConnection, isViable: Bool) {
        // Respond to a WebSocket connection viability change event
    }

    func webSocketDidAttemptBetterPathMigration(result: Result<WebSocketConnection, NWError>) {
        // Respond to when a WebSocket connection migrates to a better network path
        // (e.g. A device moves from a cellular connection to a Wi-Fi connection)
    }

    func webSocketDidReceiveError(connection: WebSocketConnection, error: NWError) {
        // Respond to a WebSocket error event
    }

    func webSocketDidReceivePong(connection: WebSocketConnection) {
        // Respond to a WebSocket connection receiving a Pong from the peer
    }

    func webSocketDidReceiveMessage(connection: WebSocketConnection, string: String) {
        
        if (connected)
        {
            // try to decode the string as a JSON
            let decoder = JSONDecoder()
            do {
                print(string)
                print(string.data(using: .utf8)!)
                let msg = try decoder.decode(IncomingMsg.self, from: string.data(using: .utf8)!)
                // do different actions
                if (msg.action == "add"){
                    let stickyJSON = msg.msg!
                    var sticky = Sticky(title: stickyJSON.title, content: stickyJSON.content, instructions: stickyJSON.instructions.map {text in Instruction(name:text)},  external_id: msg.id)
                    sticky.soundEffectID = stickyJSON.notificationSoundID ?? -1
                    self.stickyData.addActiveSticky(sticky: sticky, play_sound: true)
                    print("adding card")
                }
                else if (msg.action == "remove" && msg.id != ""){
                    // remove if and only if its not completed by the user
                    self.stickyData.active_stickyNotes = self.stickyData.active_stickyNotes.filter{ sticky in
                        return sticky.external_id != msg.id
                    }
                }
            }
            catch let error
            {
                // do nothing
                print("decode error: \(error)")
            }
        }
        else {
            // try to decode the string as a JSON
            let decoder = JSONDecoder()
            do {
                print(string)
                print(string.data(using: .utf8)!)
                let msg = try decoder.decode(ResponseMsg.self, from: string.data(using: .utf8)!)
                if (msg.response == "success"){
                    self.connected = true
                    self.stickyData.connected = true
                    print("CONNECTED!")
                }
            }
            catch let error
            {
                // do nothing
                print("decode error: \(error)")
            }
        }
    }
    
    func webSocketDidReceiveMessage(connection: WebSocketConnection, data: Data) {

        print("received some data")
        print(data)
    }
}
