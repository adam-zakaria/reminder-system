import Foundation
import NWWebSocket
import Network
import CoreBluetooth
import AudioToolbox

struct StickyJSON: Codable {
    var title: String
    var content: String
    var notificationSoundID: Int?
    var instructions: [String]
}

struct IncomingMsg: Codable {
    var action: String
    var id: String
    var lightCategoryId: Int
    var msg: StickyJSON?
}

struct ResponseMsg: Codable {
    var response: String
}

class ExternalDataManager: WebSocketConnectionDelegate, ObservableObject {
    @Published var lastData: String = ""
    @Published var connected: Bool = false
    @Published var socketURL: URL?
    @Published var notificationSoundId: Int? = nil  // Add this line
    var socket: NWWebSocket? = nil
    var stickyData: StickyData
    var bleManager = BLEManager()
    
    // init(stickyData: StickyData, socketURL: URL? = URL(string: "https://gateway.parcs.northeastern.edu/ai-caring/api/")) {
    //init(stickyData: StickyData, socketURL: URL? = URL(string: "http://localhost:7628")) {
    init(stickyData: StickyData, socketURL: URL? = URL(string: "ws://localhost:7628")){
        self.stickyData = stickyData
        self.socketURL = socketURL
        self.socket = NWWebSocket(url: self.socketURL!)
        self.socket?.delegate = self
    }
    
    func connect_and_initialize() {
        print("in connect and initialize")
        if (!self.connected) {
            self.socket?.connect()
            self.socket?.listen()
            self.socket?.send(string: "{\"type\": \"init\",\"secret\":\"qyPDrj5yxq6rUHbwHbpTR8CXJVRFWRSU\",\"role\": \"client\",\"home_key\": \"ep6\"}")
        }
    }
    
    func disconnect() {
        self.socket?.disconnect(closeCode: .protocolCode(.normalClosure))
        self.connected = false
        self.stickyData.connected = false
        print("external data disconnected.")
    }
    
    func changeSocketURL(newURL: URL) {
        self.disconnect()
        self.socketURL = newURL
        self.socket = NWWebSocket(url: self.socketURL!)
        self.socket?.delegate = self
        self.connect_and_initialize()
    }
    
    func webSocketDidConnect(connection: WebSocketConnection) {
        print("connected")
        self.connected = true
        self.stickyData.connected = true
    }

    func webSocketDidDisconnect(connection: WebSocketConnection, closeCode: NWProtocolWebSocket.CloseCode, reason: Data?) {
        print("failed \(closeCode)")
        print(reason ?? "No reason provided")
        self.connected = false
        self.stickyData.connected = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            self.connect_and_initialize()
        }
    }

    func webSocketViabilityDidChange(connection: WebSocketConnection, isViable: Bool) {
        print("WebSocket viability did change: \(isViable)")
    }

    func webSocketDidAttemptBetterPathMigration(result: Result<WebSocketConnection, NWError>) {
        switch result {
        case .success:
            print("Successfully migrated to a better path")
        case .failure(let error):
            print("Failed to migrate to a better path: \(error)")
        }
    }

    func webSocketDidReceiveError(connection: WebSocketConnection, error: NWError) {
        print("WebSocket did receive error: \(error)")
    }

    func webSocketDidReceivePong(connection: WebSocketConnection) {
        print("WebSocket did receive Pong")
    }

    func webSocketDidReceiveMessage(connection: WebSocketConnection, string: String) {
        if (connected) {
            let decoder = JSONDecoder()
            do {
                print(string)
                let data = string.data(using: .utf8)!
                let msg = try decoder.decode(IncomingMsg.self, from: data)
                if (msg.action == "add") {
                    let stickyJSON = msg.msg!
                    var sticky = Sticky(title: stickyJSON.title, content: stickyJSON.content, instructions: stickyJSON.instructions.map { text in Instruction(name: text) }, external_id: msg.id)
                    sticky.soundEffectID = stickyJSON.notificationSoundID ?? -1
                    self.notificationSoundId = stickyJSON.notificationSoundID  // Update notificationSoundId
                    self.stickyData.addActiveSticky(sticky: sticky, play_sound: true)
                    
                   
                    // Log and play the notification sound directly
                    if let soundID = stickyJSON.notificationSoundID {
                        print("Playing sound with ID: \(soundID)")
                        AudioServicesPlaySystemSound(1007)
                    } else {
                        print("No valid sound ID found.")
                    }
                    
                    self.bleManager.writeColor(value: msg.lightCategoryId)
                    print("adding card")
                } else if (msg.action == "remove" && msg.id != "") {
                    print(msg, "remove")
                    self.stickyData.active_stickyNotes = self.stickyData.active_stickyNotes.filter { sticky in
                        return sticky.external_id != msg.id
                    }
                    self.bleManager.writeColor(value: msg.lightCategoryId)
                }
            } catch let error {
                print("decode error: \(error)")
            }
        } else {
            let decoder = JSONDecoder()
            do {
                print(string)
                let data = string.data(using: .utf8)!
                let msg = try decoder.decode(ResponseMsg.self, from: data)
                if (msg.response == "success") {
                    self.connected = true
                    self.stickyData.connected = true
                    print("CONNECTED!")
                }
            } catch let error {
                print("decode error: \(error)")
            }
        }
    }

    func webSocketDidReceiveMessage(connection: WebSocketConnection, data: Data) {
        print("received some data")
        print(data)
    }
}
