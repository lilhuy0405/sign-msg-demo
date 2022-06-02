import {useEffect, useState} from 'react'
import {ethers} from "ethers";

declare global {
  interface Window {
    ethereum: any;
  }
}

function App() {
  const [account, setAccount] = useState('')
  const [signature, setSignature] = useState('')
  const isWeb3Browser = !!window.ethereum
  const provider = isWeb3Browser ? new ethers.providers.Web3Provider(window.ethereum) : null;
  const signer = provider ? provider.getSigner() : null;
  const [user, setUser] = useState('')
  const [message, setMessage] = useState('')
  const handleChangeAccount = async (accounts: string[]) => {
    if (!signer) return
    if (accounts.length > 0) {
      const accountAddress = accounts[0]
      setAccount(accountAddress)
      await login(accountAddress)
    }
  }
  useEffect(() => {
    if (isWeb3Browser) {
      window.ethereum.on('accountsChanged', handleChangeAccount)
    }
    return () => {
      window.ethereum.removeListener('accountsChanged', handleChangeAccount)
    }
  }, [])

  const handleSign = async (e: any) => {
    e.preventDefault()
    if (!signer) return
    const sig = await signer.signMessage(message)
    setSignature(sig)
    console.log(sig)
  }
  const login = async (address: any) => {
    if (!signer) return
    if (!address) {
      alert("please connect wallet")
      return
    }
    const message = "login one-time code: ".concat(new Date().getTime().toString())
    setMessage(message)
    const sig = await signer.signMessage(message)
    setSignature(sig)

    try {
      const rawResponse = await fetch('https://marathon.luxbus.vn/auth', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({message: message, signature: sig, address: account})
      });
      const res = await rawResponse.json()
      console.log(res)
      setUser(res.data.user.address)
      if (!rawResponse.ok) {
        throw new Error("post failed")
      }
    } catch (err) {
      console.log(err)
      return
    }

  }
  const handleLogin = async () => {
    await login(account)
  }
  const activate = async () => {
    if (!isWeb3Browser || !signer) {
      alert("metamask not installed")
      return
    }
    try {
      // request login to meta mask
      await window.ethereum.request({method: 'eth_requestAccounts'});
      const address = await signer.getAddress()
      setAccount(address)
    } catch (err) {
      console.log(err)
    }
  }
  const deactive = () => {
    setAccount('')
  }

  return (
    <div style={{padding: 20}}>
      <div>{account}</div>
      <div>
        <button onClick={activate}>Connect wallet</button>
        <button onClick={deactive}>Disconnect wallet</button>
      </div>
      <button onClick={handleLogin}>Sign in</button>
      <div>
        message: {message}
      </div>
      <div>
        <p>Signature: {signature}</p>
      </div>
      <div>
        user from database {user}
      </div>
    </div>
  )
}

export default App
