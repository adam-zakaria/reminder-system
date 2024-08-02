//
//  sticky.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/16/23.
//

import SwiftUI
import NavigationTransitions
import AVFoundation

//this is how we modify the style & interaction of the stickies
struct stickyCard: View {
    @State var sticky: Sticky
    @State var showingInstructions = false
    @State var animationActive = false
    @State var tap = false
    @EnvironmentObject var stickyList: StickyData
    @State private var dragAmount = CGSize.zero
    let synthesizer = AVSpeechSynthesizer()
    
    var body: some View {
        NavigationStack {
            VStack{
                GeometryReader { proxy in
                    VStack(alignment: .leading) {
                        HStack{
                            Group{
                                if(!sticky.finished){
                                    Text("finished ?")
                                        .font(.system(size: 25))
                                        .bold()
                                        .foregroundColor(.white)
                                        .background(
                                            Capsule()
                                                .fill(.black)
                                                .frame(width: proxy.size.width/2.5, height: proxy.size.height/8))
                                }
                                else{
                                    (Text(Image(systemName:"checkmark"))+Text("  finished"))
                                        .font(.system(size: 25))
                                        .bold()
                                        .frame(maxWidth: .infinity)
                                        .foregroundColor(.white)
                                        .background(Color.green)
                            
                                }
                            }
                            .onTapGesture {
                                if(sticky.finished){
                                    print("archived not available")
                                } else {
                                    tap = true
                                    print("completed")
                                    sticky.finished = true
                                    if let index = self.stickyList.active_stickyNotes.firstIndex(where: { $0.id == sticky.id }) {
                                        self.stickyList.active_stickyNotes.remove(at: index)
                                    }
                                    self.stickyList.archive_stickyNotes.append(sticky)
                                    self.stickyList.turnOffLights() // Turn off the lights
                                }
                            }
                            Spacer()
                            if (sticky.finished){
                                Text("Undo")
                                    .font(.system(size: 30))
                                    .bold()
                                    .foregroundColor(.white)
                                    .background(
                                        Capsule()
                                            .fill(.red)
                                            .frame(width: proxy.size.width/2.5, height: proxy.size.height/8))
                                    .onTapGesture {
                                        sticky.finished = false
                                        if let index = self.stickyList.archive_stickyNotes.firstIndex(where: { $0.id == sticky.id }) {
                                            self.stickyList.archive_stickyNotes.remove(at: index)
                                        }
                                        self.stickyList.active_stickyNotes.append(sticky)
                                        self.stickyList.turnOnLights() // Turn on the lights
                                    }
                            }
                        }
                        .padding(3)
                        Text(sticky.title)
                            .font(.system(size: 60))
                            .bold()
                            .padding(.horizontal)
                            .minimumScaleFactor(0.5)
                        if (sticky.content != "") {
                            Text(sticky.content)
                                .font(.system(size: 35))
                                .padding(.horizontal)
                                .minimumScaleFactor(0.5)
                        }
                        ZStack {
                            RoundedRectangle(cornerRadius: 12).foregroundColor(.white)
                            HStack {
                                Image(systemName: "speaker.wave.3.fill")
                                    .resizable()
                                    .padding([.vertical, .leading], 8)
                                    .foregroundColor(.black)
                                    .scaledToFit()
                                Text("Play the audio  ")
                                    .foregroundColor(.black)
                                    .bold()
                            }
                            .padding(.horizontal, 2)
                        }
                        .fixedSize()
                        .padding(.horizontal)
                        .onTapGesture {
                            if !synthesizer.isSpeaking {
                                let utterance = AVSpeechUtterance(string: sticky.content)
                                utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
                                synthesizer.speak(utterance)
                            } else {
                                print("Speech synthesizer is already speaking.")
                            }
                        }
                        Spacer()
                        Group {
                            if (sticky.instructions.count > 0) {
                                Button(action: {
                                    showingInstructions = true
                                    print("Show Instructions")
                                }, label: {
                                    (Text("**Instructions**   ") + Text(Image(systemName: "arrow.right.circle")))
                                        .frame(alignment: .trailing)
                                        .padding(.leading)
                                        .font(.system(size: 20))
                                        .foregroundColor(.white)
                                        .lineLimit(1)
                                })
                                .frame(width: proxy.size.width, height: proxy.size.height / 6, alignment: .leading)
                                .background(Color.black)
                                .navigationDestination(isPresented: $showingInstructions) {
                                    detailView(sticky: $sticky)
                                }
                            }
                        }.frame(alignment: .bottom)
                    }
                    .foregroundColor(.black)
                }
                .frame(width: 330, height: 330, alignment: .top)
                .background(sticky.backgroundColor
                    .shadow(color: .gray, radius: 10, x: 12, y: 4))
            }
            .offset(dragAmount)
            .gesture(DragGesture(minimumDistance: 0, coordinateSpace: .local)
                .onChanged { dragAmount = $0.translation }
                .onEnded { value in
                    if (!sticky.finished && (dragAmount.height > 50 || dragAmount.width > 50)) {
                        print("completed")
                        dragAmount = .zero
                        sticky.finished = true
                        if let index = self.stickyList.active_stickyNotes.firstIndex(where: { $0.id == sticky.id }) {
                            self.stickyList.active_stickyNotes.remove(at: index)
                        }
                        self.stickyList.archive_stickyNotes.append(Sticky(title: sticky.title, content: sticky.content, finished: true))
                        print(self.stickyList.active_stickyNotes.count)
                        self.stickyList.turnOffLights() // Turn off the lights
                    } else if (sticky.finished) {
                        print("archive not draggable")
                        dragAmount = .zero
                    } else if (!(dragAmount.height > 50 || dragAmount.width > 50)) {
                        print("please drag more")
                        dragAmount = .zero
                    }
                })
            .scaleEffect(tap ? 0.5 : 1.0)
        }
    }
}

struct stickyCard_Previews: PreviewProvider {
    static var previews: some View {
        let note1 = Sticky(title: "Title", content: "Content", instructions: [Instruction(name: "Open")], finished: true)
        stickyCard(sticky: note1)
            .padding(40)
            .previewLayout(.fixed(width: 480, height: 300))
    }
}
