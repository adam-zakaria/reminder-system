//
//  ContentViewModel.swift
//  MealPrep
//
//  Created by PARCS Lab on 7/5/24.
//

import SwiftUI
import Combine

class ContentViewModel: ObservableObject {
    @Published var brightness: Double = 50
    private var bleManager = BLEManager()
    
    func connectBLE() {
        bleManager.centralManagerDidUpdateState(bleManager.centralManager)
    }
    
    func setColor(_ value: Int) {
        bleManager.writeColor(value: value)
    }
    
    func setBrightness(_ value: Int) {
        bleManager.writeBrightness(value: value)
    }
    
    // Handle external data
    func handleExternalData(_ data: [String: Any]) {
        if let colorValue = data["color"] as? Int {
            setColor(colorValue)
        }
        if let brightnessValue = data["brightness"] as? Int {
            setBrightness(brightnessValue)
        }
    }
    
    // Mock function to simulate receiving external data
    func receiveExternalData() {
        let externalData: [String: Any] = ["color": 3, "brightness": 100]
        handleExternalData(externalData)
    }
}
