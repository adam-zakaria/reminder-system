import Foundation
import SwiftUI
import Combine
import AVFoundation
import AudioToolbox

struct Instruction: Identifiable {
    var id = UUID()
    var name: String
    var finished: Bool = false
    var utterance: AVSpeechUtterance

    init(name: String, utteranceStr: String? = nil) {
        self.name = name
        self.utterance = AVSpeechUtterance(string: utteranceStr ?? name)
        self.utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
    }
}

struct Sticky: Identifiable {
    var id = UUID()
    var title: String
    var content: String
    var external_id: String
    var soundEffectID: Int = -1
    var mainUtterance: AVSpeechUtterance
    var finished: Bool = false
    var instructions: [Instruction]
    var backgroundColor: Color = Color("stickyYellow")
    var notificationSoundId: Int? = nil

    init(title: String, content: String = "", instructions: [Instruction]? = nil, mainUtteranceStr: String? = nil, finished: Bool = false, external_id: String = "", soundEffectID: Int = -1, notificationSoundId: Int? = nil) {
        self.title = title
        self.content = content
        self.external_id = external_id
        self.instructions = instructions ?? []
        self.mainUtterance = AVSpeechUtterance(string: mainUtteranceStr ?? (content != "" ? content : title))
        self.mainUtterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        self.finished = finished
        self.soundEffectID = soundEffectID
        self.notificationSoundId = notificationSoundId
    }
}

class StickyData: ObservableObject {
    @Published var active_stickyNotes = [Sticky]()
    @Published var archive_stickyNotes = [Sticky]()
    @Published var tutorial_mode = true
    @Published var connected = false
    var bleManager = BLEManager() // Add the BLE manager here

    init(active_stickyNotes: [Sticky], archive_stickyNotes: [Sticky]) {
        print("init new array")
        self.active_stickyNotes = active_stickyNotes
        self.archive_stickyNotes = archive_stickyNotes
    }

    init() {
        print("init struct list")
        /*
        self.active_stickyNotes = [
            Sticky(title: "Fridge!", content: "Remember to close the fridge."),
            Sticky(title: "Stove!", content: "Remember to turn off the stove.", instructions: [
                Instruction(name: "Walk to Stove"),
                Instruction(name: "Turn off Stove")
            ]),
            Sticky(title: "Watch Game @ 7pm", content: "Watch soccer game on ESPN at 7pm.")
        ]
         */
        

        self.archive_stickyNotes = []
    }

    func addActiveSticky(sticky: Sticky, play_sound: Bool = false) {
        self.active_stickyNotes.insert(sticky, at: 0)
        if play_sound, let soundID = sticky.notificationSoundId {
            AudioServicesPlaySystemSound(SystemSoundID(soundID))
        }
    }

    func completedTutorial() {
        self.tutorial_mode = false
        self.active_stickyNotes = [
            Sticky(title: "Whole wheat bread", content: "Remember to use whole wheat bread for sandwich"),
            Sticky(title: "Be Kind and Be Happy!")
        ]
        self.archive_stickyNotes = []
    }

    func turnOffLights() {
        bleManager.writeColor(value: 0) // Assuming 0 is the code to turn off the lights
    }

    func turnOnLights() {
        bleManager.writeColor(value: 1) // Assuming 1 is the code to turn on the lights
    }
}
