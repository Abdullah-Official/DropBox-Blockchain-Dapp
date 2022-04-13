//import DStorage from '../abis/DStorage.json'
import React, { Component } from 'react';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';
import { useEffect, useState } from 'react';
import DStorage from '../abis/DStorage.json'

//Declare IPFS
import ipfsClient from 'ipfs-http-client';
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

const App = () => {

  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('');
  const [buffer, setBuffer] = React.useState('');
  const [dstorage, setDstorage] = useState({})
  console.log(files)
  useEffect(() => {
    loadWeb3()
    loadBlockchainData()
  },[])

  const loadWeb3 = async () => {
    console.log('hello')
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  const loadBlockchainData = async  () => {
    //Declare Web3
    const web3 = window.web3;
    //Load account
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0])
    const networkId = await web3.eth.net.getId()
    const networkData = DStorage.networks[networkId]
    if(networkData){
      const dstorage = new web3.eth.Contract(DStorage.abi, networkData.address);
      console.log(dstorage);
      setDstorage(dstorage)
      const fileCount = await dstorage.methods.fileCount().call();
      console.log(fileCount)
      for (var i = fileCount; i >= 1; i--) {
        const file = await dstorage.methods.files(i).call()
        console.log(file)
        setFiles(
        [...files, file]
        )
      }
    }
    else {
      window.alert('DStorage contract not deployed to detected network.')
    }
      setLoading(false)

  }

  // Get file from user
  const captureFile = event => {
    event.preventDefault()

    const file = event.target.files[0]
    const reader = new window.FileReader()

      reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      setName(file?.name);
      setType(file?.type);
      setBuffer(Buffer(reader.result))
         }
    console.log('buffer', {name, type, buffer})

  }


  //Upload File
  const uploadFile = description => {

    console.log("Submitting file to IPFS...")
    // Add file to the IPFS
    ipfs.add(buffer, (error, result) => {
      console.log('IPFS result', result.size)
      if(error) {
        console.error(error)
        return
      }

      setLoading(true)
      // Assign value for the file without extension
      if(type === ''){
        setType('none')
      }
      console.log({type, name ,description})
      dstorage.methods.uploadFile(result[0].hash, result[0].size, type, name, description).send({ from: account }).on('transactionHash', (hash) => {
       setName('');
       setType('');
       setBuffer(null)
       window.location.reload()
      }).on('error', (e) =>{
        window.alert('Error')
        setLoading(false)
      })
    })

  }


    return (
      <div>
        <Navbar account={account} />
        { loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              files={files}
              captureFile={captureFile}
              uploadFile={uploadFile}
            />
        }
      </div>
    );
}

export default App;