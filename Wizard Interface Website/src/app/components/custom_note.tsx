'use client';

import { useState, useEffect } from "react"
import { Button } from "react-bootstrap";

export default function CustomNote({sendNoteFunc}: { sendNoteFunc: (msg: object, id: string) => void }) {

    let [title, setTitle] = useState<string>("")
    let [id, setID] = useState<string>("")
    let [content, setContent] = useState<string>("")
    let [instructions, setInstructions] = useState<string[]>([])
    let [singleInstruction, setSingleInstruction] = useState<string>("")
    let [notificationSoundID, setNotificationSoundID] = useState<number>(-1)

    return (
        <div style={{ flexDirection: "column", display: 'flex' }}>
            <div>
                <div style={{ flexDirection: "row", display: 'flex' }}>
                    <h3 style={{ flex: 1 }}>ID</h3>
                    <input style={{ flex: 2 }} type="text" placeholder="ID" value={id} onChange={(e) => setID(e.target.value)}></input>
                </div>
            </div>
            <div>
                <div style={{ flexDirection: "row", display: 'flex' }}>
                    <h3 style={{ flex: 1 }}>Title</h3>
                    <input style={{ flex: 2 }} type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}></input>
                </div>
            </div>
            <div>
                <div style={{ flexDirection: "row", display: 'flex' }}>
                    <h6 style={{ flex: 1 }}>Sound Notification ID</h6>
                    <input style={{ flex: 2 }} type="number" placeholder="Content" value={notificationSoundID} onChange={(e) => setNotificationSoundID(Number(e.target.value))}></input>
                </div>
            </div>
            <div>
                <div style={{ flexDirection: "row", display: 'flex' }}>
                    <h3 style={{ flex: 1 }}>Content</h3>
                    <input style={{ flex: 2 }} type="text" placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)}></input>
                </div>
            </div>
            <h3>Instructions</h3>
            {/* map each instructions into its own div */}
            {instructions?.map((instruction, idx) => {
                return (
                    <div key={instruction + idx} style={{ flexDirection: 'row', display: 'flex', marginTop: '0.5em'}}>
                        <p style={{ flex: 16 }}>{instruction}</p>
                        <Button style={{ flex: 1 }} className="btn" onClick={()=>{
                            if (idx > 0) {
                                let temp = instructions[idx]
                                instructions[idx] = instructions[idx - 1]
                                instructions[idx - 1] = temp
                                setInstructions([...instructions])
                            }
                        }} disabled={idx == 0}>˄</Button>
                        <Button style={{ flex: 1 }} className="btn" onClick={()=>{
                            if (idx < instructions.length - 1) {
                                let temp = instructions[idx]
                                instructions[idx] = instructions[idx + 1]
                                instructions[idx + 1] = temp
                                setInstructions([...instructions])
                            }
                        }} disabled={idx == instructions.length - 1}>˅</Button>
                        <Button style={{ flex: 3 }} className="btn-danger" onClick={()=>{
                            setInstructions(instructions.filter((_, i) => i !== idx))
                        }}>Delete</Button>
                    </div>
                )
            })}
            <div style={{ flexDirection: 'row', display: 'flex', marginTop:'1em', marginBottom:'1em'}}>
                <input style={{ flex: 4 }} type="text" placeholder="Last instruction" value={singleInstruction} onChange={(e) => setSingleInstruction(e.target.value)}></input>
                <Button style={{ flex: 1, marginLeft: '1em'}} onClick={()=>{
                    setInstructions([...instructions, singleInstruction])
                    setSingleInstruction("")
                }}>Add</Button>
            </div>
            <Button onClick={()=> {
                sendNoteFunc({
                    'title': title,
                    'content': content,
                    'instructions': instructions,
                    'id': id,
                    'notificationSoundID': notificationSoundID
                }, id)
                setID("")
                setTitle("")
                setContent("")
                setInstructions([])
                setNotificationSoundID(-1)
            }} disabled={title == "" || content == "" || id == ""}>
                Send
            </Button>
        </div>
    )
}

