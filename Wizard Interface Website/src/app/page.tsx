'use client'

import styles from './page.module.css'
import { useState, useEffect } from 'react'
import ErrorPage from './components/error_page'
import LoadingPage from './components/loading_page'
import CustomNote from './components/custom_note'
import { SendingPage, SentPage } from './components/sent_page'
import { Button, Container } from "react-bootstrap";
import useWebSocket, { ReadyState } from 'react-use-websocket';


export default function Home() {

  const [token, setToken] = useState<string>("")
  const [ready, setReady] = useState<boolean>(false)
  const [sending, setSending] = useState<boolean>(false)
  const [sent, setSent] = useState<boolean>(false)
  const [socketURL, setSocketURL] = useState<string>('wss://z.ngrok.dev')
  const [deleteID, setDeleteID] = useState<string>("")
  const [homeID, setHomeID] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketURL);
  // run the following code only once

  useEffect(() => {
    console.log("version: 0.0.3")
    // get the token from the website's query
    let url = new URL(window.location.href)
    let token = url.searchParams.get("token")
    let socketURL = url.searchParams.get("socketURL")
    if (socketURL) {
      setSocketURL(socketURL)
    }
    if (token) {
      setToken(token)
      // connect to main server
    }
    else {
      setReady(true)
      setErrorMsg("No token provided")
    }
  }, [])

  useEffect(() => {
    // send the initial message and see 
    if (readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify({
        'type': 'init',
        'secret': token,
        'role': 'primary'
      }))
    }
  }, [token, readyState])

  useEffect(() => {
    if (!ready) {
      // try to parse the message
      if (lastMessage) {
        const msg = JSON.parse(lastMessage.data)
        console.log(msg)
        if (msg.response == 'success') {
          setReady(true)
        }
        else {
          setErrorMsg(msg.response)
        }
      }
    }

    if (sending) {
      // try to parse the message
      if (lastMessage) {
        const msg = JSON.parse(lastMessage.data)
        if (msg.response == 'success') {
          setSending(false)
          setSent(true)
        }
        else {
          setSending(false)
          setErrorMsg(msg.response)
        }
      }
    }


  }, [lastMessage])

  if (!ready && errorMsg == "") {
    return <LoadingPage />
  }

  if (!token || errorMsg != "") {
    return <ErrorPage msgs={errorMsg} />
  }

  if (sending) {
    return <SendingPage />
  }

  if (sent) {
    return <SentPage returnFunc={() => { setSent(false) }} />
  }

  function sendNote(msg: object, id: string) {
    // send note
    sendMessage(JSON.stringify({
      'type': 'broadcast',
      'id': id,
      'message': msg
    }))
    setSending(true)
  }

  function deleteNote(id: string, home_key: string = "") {
    // delete note    
    sendMessage(JSON.stringify({
      'type': 'remove',
      'id': id,
      'home_key': home_key
    }))
    setSending(true)
  }

  return (
    <div className={styles.description}>
      <div style={{ flex: 1 }}>
        <h1 className={styles.controlTitle}>Wizard Control</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Button onClick={() => {
            sendNote({
              'title': 'Close Microwave',
              'content': 'Microwave is open. Please close the microwave.',
              'instructions': [],
              'notificationSoundID': 1321
            }, 'm1')
          }}>
            Send Microwave open message
          </Button>
          <Button style={{ marginTop: '1em' }} onClick={() => {
            sendNote({
              'title': 'Clean Up Kitchen',
              'content': 'Put the bread, peanut butter, and jelly away.',
              'instructions': [
                'Put the bread in the cabinet',
                'Put the peanut butter in the cabinet',
                'Put the jelly in the fridge'
              ],
              'notificationSoundID': 1321
            }, 'm2')
          }}>
            Send CleanUp Message
          </Button>
        </div>
      </div>

      <div style={{ flex: 2 }}>
        <h1 className={styles.controlTitle}>Custom Control</h1>
        <CustomNote sendNoteFunc={sendNote} />
      </div>

      <div style={{ flex: 1 }}>
        <h1 className={styles.controlTitle}>Delete Control</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <h3 style={{ flex: 1 }}>ID</h3>
            <input type="text" style={{ flex: 1 }} value={deleteID} onChange={(e) => { setDeleteID(e.target.value) }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <h3 style={{ flex: 1 }}>Home</h3>
            <input type="text" style={{ flex: 1 }} value={homeID} onChange={(e) => { setHomeID(e.target.value) }} />
          </div>
          <Button style={{ marginTop: '1em' }} onClick={() => {
            if (deleteID == "") {
              return
            }
            setDeleteID("")
            deleteNote(deleteID, homeID)
          }} disabled={deleteID == ""}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
