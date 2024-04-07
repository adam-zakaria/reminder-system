//
//  detailView.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/16/23.
//

import SwiftUI
import AVFoundation

struct detailView: View {
    @Binding var sticky: Sticky
    @EnvironmentObject var stickyList: StickyData
    let synthesizer = AVSpeechSynthesizer()
    var body: some View {
        
        GeometryReader { geometry in
            //Add background color/texture
            ZStack{
                Color("stickyYellow")
                    .ignoresSafeArea()
            }
            
            VStack{
                HStack{
                    Spacer()
                    Text(getTime())
                        .font(.system(size: 40))
                        .bold()
                    
                }
                //.padding(.horizontal)
                HStack{
                    Spacer()
                    (Text(getDayname())
                     +  Text(" , ")
                     +  Text(getDate()))
                        .font(.system(size: 30))
                }
                //.padding(.horizontal)
                HStack{
                    Text(sticky.title)
                        .font(.system(size: 50))
                        .bold()
                    Spacer()
                }
                //.padding(.horizontal)
                VStack{
                    HStack{
                        
                        Rectangle()
                            .fill(sticky.finished ? Color.black : Color.white)
                            .border(Color.orange,width:5)
                            .frame(width: 60, height: 60)
                            .cornerRadius(5)
                            .onTapGesture {
                                sticky.finished =  !sticky.finished
                                // make all instruction true
                                for idx in 0...sticky.instructions.count-1
                                {
                                    sticky.instructions[idx].finished = sticky.finished
                                    
                                }
                                print(self.stickyList.active_stickyNotes.count)
                                
                                //delete from active stickynotes
                                if let index = self.stickyList.active_stickyNotes.firstIndex(where: {$0.id == sticky.id}){
                                    self.stickyList.active_stickyNotes.remove(at: index)
                                }
                                
                                //add to archive stickynotes
                                self.stickyList.archive_stickyNotes.append(Sticky(title: sticky.title, content: sticky.content, finished: true))
                                print("delete")
                            }
//                        Spacer()
//                            .frame(width: 20)
                        Text("  Complete All")
                            .frame(alignment: .leading)
                            .font(.system(size: 40))
                            .bold()
                            .foregroundColor(.orange)
                            .padding(.horizontal)
                        Spacer()
                         Text(Image(systemName: "speaker.wave.3.fill"))
                            .foregroundColor(.orange)
                            .font(.system(size: 40))
                            .onTapGesture {
                                for instruction in sticky.instructions{
                                    synthesizer.speak(instruction.utterance)
                                }
                            }
                         
                       
                    }
                    .padding(30)

                    ScrollView{
                        LazyVStack(spacing:15){
                            ForEach(sticky.instructions) { instruction in
                                HStack{
                                    Rectangle()
                                        .fill(sticky.finished || instruction.finished ? Color.black : Color("lightgray"))
                                        
                                        .border(Color.orange,width:5)
                                        .frame(width: 60, height: 60)
                                        .cornerRadius(5)
                                        .onTapGesture {
                                            // get the st
                                            print(instruction)
                                            var idx = sticky.instructions.firstIndex(where:{ testInstruction in
                                                testInstruction.id == instruction.id
                                            })
                                            if (idx != nil){
                                                sticky.instructions[idx ?? 0].finished = !instruction.finished
                                            }
                                            print(sticky.finished)
                                        }
                                    (Text("  ") +
                                     Text(instruction.name))
                                    .frame(alignment: .leading)
                                    .font(.system(size: 40))
                                    .bold()
                                    .foregroundColor(.black)
                                    .padding(.horizontal)
                                    Spacer()
                                    Text(Image (systemName: "speaker.wave.3.fill"))
                                        .foregroundColor(.orange)
                                        .font(.system(size: 40))
                                        .onTapGesture {
                                            print("Tap")
                                            synthesizer.speak(instruction.utterance)
                                        }
                                    
                                }
                                .padding(30)
                                .background(
                                    Rectangle()
                                        .fill(Color("lightgray"))
                                        .cornerRadius(10)
                                )
                                
                            }
                        }
                    }
                    
                }
                .padding(.horizontal,20)
                .background(
                    Rectangle()
                        .fill(.white)
                        .cornerRadius(10)
                )
                
                
                
            }
            .frame(alignment: .top)
            .padding(.horizontal)
            
        }
    }
}

struct detailView_Previews: PreviewProvider {
    static var previews: some View {
        let note1 = Sticky(title:"Title",content:"Content", instructions:
        [Instruction(name: "got to store"),
        Instruction(name: "buy milk")])
        detailView(sticky:.constant(note1))
    }
}

