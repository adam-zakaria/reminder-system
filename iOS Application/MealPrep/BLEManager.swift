import Foundation
import CoreBluetooth

class BLEManager: NSObject, ObservableObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    @Published var isConnected = false
    @Published var isDisconnected = false
    @Published var handshakeMessage = ""
    
    var centralManager: CBCentralManager!
    var peripheral: CBPeripheral?

    let ledServiceUUID = CBUUID(string: "19B10000-E8F2-537E-4F6C-D104768A1214")
    let colorCharacteristicUUID = CBUUID(string: "19B10001-E8F2-537E-4F6C-D104768A1214")
    let brightCharacteristicUUID = CBUUID(string: "19B10002-E8F2-537E-4F6C-D104768A1214")
    let patternCharacteristicUUID = CBUUID(string: "19B10003-E8F2-537E-4F6C-D104768A1214")
    let handshakeCharacteristicUUID = CBUUID(string: "19B10004-E8F2-537E-4F6C-D104768A1214")

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            print("Bluetooth is powered on. Starting scan.")
            startScanning()
        } else {
            print("Bluetooth is not available.")
        }
    }

    func startScanning() {
        print("Scanning for peripherals with service UUID: \(ledServiceUUID)")
        centralManager.scanForPeripherals(withServices: [ledServiceUUID], options: nil)
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        print("Discovered peripheral: \(peripheral.name ?? "unknown") at RSSI: \(RSSI)")
        centralManager.stopScan()
        self.peripheral = peripheral
        self.peripheral?.delegate = self
        centralManager.connect(peripheral, options: nil)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        print("Connected to peripheral: \(peripheral.name ?? "unknown")")
        peripheral.discoverServices([ledServiceUUID])
        isConnected = true
        isDisconnected = false
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        print("Disconnected from peripheral: \(peripheral.name ?? "unknown")")
        isConnected = false
        isDisconnected = true
        reconnect()
    }

    func reconnect() {
        if let peripheral = peripheral {
            print("Reconnecting to peripheral: \(peripheral.name ?? "unknown")")
            centralManager.connect(peripheral, options: nil)
        } else {
            print("Peripheral not found, starting scan again.")
            startScanning()
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error = error {
            print("Error discovering services: \(error.localizedDescription)")
            return
        }
        print("Discovered services for peripheral: \(peripheral.name ?? "unknown")")
        if let services = peripheral.services {
            for service in services {
                print("Discovering characteristics for service: \(service.uuid)")
                peripheral.discoverCharacteristics([colorCharacteristicUUID, brightCharacteristicUUID, patternCharacteristicUUID, handshakeCharacteristicUUID], for: service)
            }
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let error = error {
            print("Error discovering characteristics: \(error.localizedDescription)")
            return
        }
        print("Discovered characteristics for service: \(service.uuid)")
        if let characteristics = service.characteristics {
            for characteristic in characteristics {
                if characteristic.uuid == colorCharacteristicUUID {
                    print("Color Characteristic found")
                } else if characteristic.uuid == brightCharacteristicUUID {
                    print("Brightness Characteristic found")
                } else if characteristic.uuid == patternCharacteristicUUID {
                    print("Pattern Characteristic found")
                } else if characteristic.uuid == handshakeCharacteristicUUID {
                    print("Handshake Characteristic found")
                    peripheral.setNotifyValue(true, for: characteristic)
                }
            }
        }
    }

    func writeColor(value: Int) {
        print("Writing color value: \(value)")
        writeValue(value: value, characteristicUUID: colorCharacteristicUUID)
    }

    func writeBrightness(value: Int) {
        print("Writing brightness value: \(value)")
        writeValue(value: value, characteristicUUID: brightCharacteristicUUID)
    }

    func writePattern(value: Int) {
        print("Writing pattern value: \(value)")
        writeValue(value: value, characteristicUUID: patternCharacteristicUUID)
    }

    private func writeValue(value: Int, characteristicUUID: CBUUID) {
        guard let peripheral = peripheral,
              let service = peripheral.services?.first(where: { $0.uuid == ledServiceUUID }),
              let characteristic = service.characteristics?.first(where: { $0.uuid == characteristicUUID }) else {
            print("Characteristic not found for UUID: \(characteristicUUID)")
            return
        }
        let data = Data([UInt8(value)])
        peripheral.writeValue(data, for: characteristic, type: .withResponse)
        print("Wrote value: \(value) to characteristic: \(characteristicUUID)")
    }

    func readColor() {
        readValue(characteristicUUID: colorCharacteristicUUID)
    }

    func readBrightness() {
        readValue(characteristicUUID: brightCharacteristicUUID)
    }

    func readPattern() {
        readValue(characteristicUUID: patternCharacteristicUUID)
    }

    private func readValue(characteristicUUID: CBUUID) {
        guard let peripheral = peripheral,
              let service = peripheral.services?.first(where: { $0.uuid == ledServiceUUID }),
              let characteristic = service.characteristics?.first(where: { $0.uuid == characteristicUUID }) else {
            print("Characteristic not found for UUID: \(characteristicUUID)")
            return
        }
        peripheral.readValue(for: characteristic)
        print("Requested read for characteristic: \(characteristicUUID)")
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print("Error updating value: \(error.localizedDescription)")
            return
        }
        if characteristic.uuid == colorCharacteristicUUID {
            print("Updated color value: \(characteristic.value ?? Data())")
        } else if characteristic.uuid == brightCharacteristicUUID {
            print("Updated brightness value: \(characteristic.value ?? Data())")
        } else if characteristic.uuid == patternCharacteristicUUID {
            print("Updated pattern value: \(characteristic.value ?? Data())")
        } else if characteristic.uuid == handshakeCharacteristicUUID {
            if let value = characteristic.value, let message = String(data: value, encoding: .utf8) {
                print("Received handshake message: \(message)")
                DispatchQueue.main.async {
                    self.handshakeMessage = message
                }
            }
        }
    }

    func checkConnection() -> Bool {
        guard let peripheral = peripheral,
              let service = peripheral.services?.first(where: { $0.uuid == ledServiceUUID }),
              let _ = service.characteristics?.first(where: { $0.uuid == colorCharacteristicUUID }) else {
            print("Connection check failed: Characteristic not found")
            return false
        }
        print("Connection check successful: Peripheral is connected")
        return true
    }
}
