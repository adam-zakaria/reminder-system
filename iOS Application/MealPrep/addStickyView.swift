//
//  addStickyView.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/30/23.
//

//NOT USING
import SwiftUI

struct addStickyView: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var stickyList: StickyData
    @State var title = ""
    @State var content = ""
    @State var instructions = [Instruction]()
    @State var individualInstruction = ""
    var body: some View {
        
        GeometryReader { geometry in
            //Add background color/texture
            ZStack{
                Color("stickyYellow")
                    .ignoresSafeArea()
            }
            
            VStack{
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
                }
                .padding(.horizontal)
                VStack{
                    HStack{
                        Text("Title:")
                            .font(.system(size: 30))
                            .bold()
                        TextField(
                            "title",
                            text: $title
                        ).font(.system(size: 30))
                    }
                    HStack{
                        Text("Content:")
                            .font(.system(size: 30))
                            .bold()
                        TextField(
                            "Content",
                            text: $content
                        ).font(.system(size: 30))
                    }
                    HStack{
                        Text("Detail instruction")
                            .font(.system(size: 30))
                            .bold()
                        Spacer()
                    }
                    // Now show all instructions
                    ForEach(instructions.indices, id: \.self) {idx in
                        HStack{
                            Spacer(minLength: 10)
                            Text(instructions[idx].name)
                            Spacer()
                            Circle()
                                .fill(Color.red)
                                .frame(width: 40)
                                .overlay(
                                    Image(systemName: "minus")
                                        .foregroundColor(.white)
                                        .font(.system(size:30))
                                        .position(x: 20, y:20)
                                    )
                                .onTapGesture {
                                    instructions.remove(at: idx)
                                }
                                
                        }
                    }
                    HStack{
                        TextField(
                            "Add Detail instruction",
                            text: $individualInstruction
                        )
                        .font(.system(size: 20))
                        .padding(.horizontal, 10)
                        .textFieldStyle(.roundedBorder)
                        
                        Circle()
                            .fill(Color.green)
                            .frame(width: 40)
                            .overlay(
                                Image(systemName: "plus")
                                    .foregroundColor(.white)
                                    .font(.system(size:30))
                                    .position(x: 20, y:20)
                                )
                            .onTapGesture {
                                instructions.append(Instruction(name:individualInstruction))
                                individualInstruction = ""
                            }
                    }
                    
                    Button("Done"){
                        if(!title.isEmpty && !content.isEmpty){
                            self.stickyList.active_stickyNotes.append(Sticky(title: title, content: content, instructions: instructions, finished: false))
                            presentationMode.wrappedValue.dismiss()
                        }
                    }
                    .font(.system(size: 40))
                    .bold()
                    .buttonStyle(.borderedProminent)
 
                }
                .padding(10)
                .background(
                    Rectangle()
                        .fill(.white)
                        .cornerRadius(10)
                )
                .padding(30)
            }
        }
    }
}

struct addStickyView_Previews: PreviewProvider {
    static var previews: some View {
        addStickyView()
    }
}
