import { Contract, providers, utils } from 'ethers'
import Head from 'next/head'
import React, { useEffect, useRef, useState } from 'react'
import Web3Modal from 'web3modal'
import { abi, NFT_CONTRACT_ADDRESS } from '../../constants'
import styles from '../styles/Home.module.css'
import { v4 as uuidV4 } from 'uuid'
import { BsCheckLg, BsHandThumbsUp, BsTrashFill } from 'react-icons/bs'

export default function Home () {
  const [todos, setTodos] = useState([])
  const [todo, setTodo] = useState('')
  const [finished, setFinished] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [addToLocalStorage, setAddToLocalStorage] = useState(false)

  useEffect(() => {
    if (getFromStorage('Todos')) {
      setTodos(JSON.parse(getFromStorage('Todos')))
    }
  }, [])

  useEffect(() => {
    todos.every(isSameAnswer)
    function isSameAnswer (el, index, arr) {
      if (index === 0) {
        return true
      } else {
        setFinished(el.completed === true && arr[index - 1].completed === true)
        return el.completed === true && arr[index - 1].completed === true
      }
    }
    if (addToLocalStorage) {
      setLocalStorage('Todos', JSON.stringify(todos))
    }
    console.log(todos)
  }, [todos])

  const setLocalStorage = (key, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }
  }

  const addTodo = e => {
    e.preventDefault()
    if (todo === '') return
    setTodos([
      ...todos,
      {
        id: uuidV4(),
        todo: todo,
        completed: false,
        deleted: false
      }
    ])
    setTodo('')
    setAddToLocalStorage(true)
  }

  const getFromStorage = key => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key)
    }
  }

  const setCompleted = id => {
    setTodos(prevTodos => {
      const updatedItems = prevTodos.map(todo => {
        if (todo.id === id) {
          return {
            ...todo,
            completed: true
          }
        }
        return todo
      })
      setAddToLocalStorage(true)
      return updatedItems
    })
  }

  const setDeleted = id => {
    setTodos(todos => {
      const updatedItems = todos.map(todo => {
        if (todo.id === id) {
          return {
            ...todo,
            completed: true,
            deleted: true
          }
        }
        return todo
      })
      setAddToLocalStorage(true)
      return updatedItems
    })
  }

  const removeLists = () => {
    setLocalStorage('Todos', '')
    setTodos([])
  }

  const [walletConnected, setWalletConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const web3ModalRef = useRef()

  const claimNFT = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      const tx = await nftContract.mint({
        value: utils.parseEther('0.00')
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
      setClaimed(true)
      removeLists()
      window.alert('You successfully claimed your NFT reward!')
    } catch (err) {
      console.error(err)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (err) {
      console.error(err)
    }
  }
  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      const _tokenIds = await nftContract.tokenIds()
      setTokenIdsMinted(_tokenIds.toString())
    } catch (err) {
      console.error(err)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    const { chainId } = await web3Provider.getNetwork()
    if (chainId !== 5) {
      window.alert('Change the network to Goerli')
      throw new Error('Change network to Goerli')
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'goerli',
        providerOptions: {},
        disableInjectedProvider: false
      })
      connectWallet()

      getTokenIdsMinted()

      setInterval(async function () {
        await getTokenIdsMinted()
      }, 5 * 1000)
    }
  }, [walletConnected])

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      )
    }
    if (claimed) {
      return (
        <button
          className={`w-100 ${styles.button}`}
          onClick={() => {
            setFinished(!claimed)
            setClaimed(!finished)
          }}
        >
          NFT Claimed!
        </button>
      )
    }

    if (loading) {
      return <button className={`w-100 ${styles.button}`}>Claiming...</button>
    }

    if (finished && !claimed) {
      return (
        <button className={`w-100 ${styles.button}`} onClick={claimNFT}>
          Claim NFT!
        </button>
      )
    }
  }

  const renderButtonRm = () => {
    if (finished && todos.length !== 0) {
      return (
        <button onClick={removeLists} className={styles.trash}>
          <BsTrashFill />
        </button>
      )
    }
  }

  return (
    <>
      <Head>
        <title>My Todos</title>
        <meta name='description' content='My Todos DApp' />
        <link rel='icon' href='/favicon.png' />
      </Head>
      <div className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>My Todos</h1>
          <p>Be rewarded with an NFT!</p>
          <div className={styles.description}>
            <form className='d-flex'>
              <input value={todo} onChange={e => setTodo(e.target.value)} />
              <button
                onClick={e => {
                  addTodo(e)
                }}
              >
                +
              </button>
            </form>
            {todos
              .filter(({ deleted }) => !deleted)
              .map(({ todo, completed, id }) => (
                <div
                  className='d-flex'
                  style={{ maxWidth: '19.6rem' }}
                  key={id}
                >
                  <p className='m-auto'>{todo}</p>
                  {completed ? (
                    <BsHandThumbsUp
                      className='my-auto'
                      style={{ marginRight: '5px' }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setCompleted(id)
                      }}
                      className={styles.completed}
                    >
                      <BsCheckLg />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDeleted(id)
                    }}
                    className={styles.trash}
                  >
                    <BsTrashFill />
                  </button>
                </div>
              ))}
            <div className='d-flex'>
              {renderButton()}
              {renderButtonRm()}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
