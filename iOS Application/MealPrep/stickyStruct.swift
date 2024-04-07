//
//  stickyStruct.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/16/23.
//

import Foundation
import SwiftUI
import Combine
import AVFoundation

struct Instruction: Identifiable {
    var id = UUID()
    var name: String
    var finished: Bool = false
    var utterance: AVSpeechUtterance
    
    init(name: String, utteranceStr: String? = nil){
        self.name = name
        self.utterance = AVSpeechUtterance(string: utteranceStr ?? name)
        self.utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
    }
}

//this is the data model of the sticky note
struct Sticky: Identifiable {
    var id = UUID()
    // These are how the sticky are shown on the main page
    var title: String
    var content: String
    var external_id: String
    var soundEffectID: Int = -1 // Empty means nothing.
    var mainUtterance: AVSpeechUtterance // This is what TTS will say.
    var finished: Bool = false
    // If they click in
    var instructions: [Instruction]
    // main page style
    var backgroundColor: Color = Color("stickyYellow")
    
    init(title: String, content:String = "", instructions: [Instruction]? = nil, mainUtteranceStr: String? = nil, finished: Bool = false, external_id: String = "", soundEffectID: Int = -1){
        self.title = title
        self.content = content
        self.external_id = external_id
        self.instructions = instructions ?? []
        self.mainUtterance = AVSpeechUtterance(string: mainUtteranceStr ?? (content != "" ? content : title))
        self.mainUtterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        self.finished = finished
        self.soundEffectID = soundEffectID
    }    
}

// An array to store stickies
class StickyData: ObservableObject{
//  @Published var stickyNotes = [Sticky]()
    @Published var active_stickyNotes = [Sticky]()
    @Published var archive_stickyNotes = [Sticky]()
    @Published var tutorial_mode = true
    @Published var connected = false
    
//    init(initList: [Sticky]){
//        self.stickyNotes = initList
//    }instr
    
    init(active_stickyNotes: [Sticky],archive_stickyNotes:[Sticky]) {
        print("init new array")
        self.active_stickyNotes = active_stickyNotes
        self.archive_stickyNotes = archive_stickyNotes
    }
    
    init(){
        print("init struct list")
////        print(self.active_stickyNotes.count)
        self.active_stickyNotes=[
            Sticky(title:"Fridge!", content: "Remember to close the fridge."),
            Sticky(title:"Stove!", content: "Remember to turn off the stove.", instructions: [
                Instruction(name:"Walk to Stove"),
                Instruction(name:"Turn off Stove"),
            ]),
            Sticky(title:"Watch Game @ 7pm", content: "Watch soccer game on ESPN at 7pm."),
            ]

        self.archive_stickyNotes=[
//            Sticky(title:"Archive1_new", content: "acontent1", finished: true)
            ]
    }
    
    func addActiveSticky(sticky: Sticky, play_sound: Bool = false)
    {
        self.active_stickyNotes.insert(sticky, at: 0)
        if (play_sound && sticky.soundEffectID >= 0 )
        {
            AudioServicesPlaySystemSound(UInt32(sticky.soundEffectID))
        }
    }
    
    func completedTutorial()
    {
        self.tutorial_mode = false
        self.active_stickyNotes=[
            Sticky(title:"Whole wheat bread", content:"Remember to use whole wheat bread for sandwich"),
            Sticky(title:"Be Kind and Be Happy!")
        ]
        self.archive_stickyNotes=[]
    }
    
//    var activeSticky: [Sticky]{
//        get {
//            return stickyNotes.filter { !$0.finished }
//        }
//    }
//
//    var archivedSticky: [Sticky]{
//        get {
//            return stickyNotes.filter { $0.finished }
//        }
//    }
//
//    var count: Int {
//        get {
//            return stickyNotes.count
//        }
//    }
}

class StickyData1: ObservableObject{
    @Published var stickyNotes = [Sticky]()
    init(initList: [Sticky]){
        self.stickyNotes = initList
    }
}
