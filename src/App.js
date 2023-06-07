import React, {useState, useEffect } from 'react';
import {TextField , Button } from '@mui/material';
import Task from './Task';
import './App.css';

//TaskContractAddress ve TaskAbi gibi değişkenlerle, görev yönetimi için kullanılacak
// Ethereum akıllı sözleşmesinin adresi ve arayüz tanımlaması dahil edilir.
import { TaskContractAddress } from './config.js';
import {ethers} from 'ethers';
import TaskAbi from './utils/TaskContract.json'

//görevleri, kullanıcının girdiğini alacak metni,
// mevcut hesabı ve doğru ağa bağlı olup olmadığını tutmak için kullanılan bazı state'leri içerir.
function App() {
  const [tasks,setTasks]=useState([]);
  const [input, setInput]=useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [correctNetwork, setCorrectNetwork] = useState(false);

  //akıllı sözleşme üzerinden kullanıcının görevlerini almak için kullanılır. Bu fonksiyon,
  // Ethereum nesnesinin mevcut olup olmadığını kontrol eder ve ardından akıllı sözleşme ile
  // etkileşim sağlar.
  const getAllTasks = async() => {
    try {
      const {ethereum} = window

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const TaskContract = new ethers.Contract(
            TaskContractAddress,
            TaskAbi.abi,
            signer
        )

        let allTasks = await TaskContract.getMyTasks();
        setTasks(allTasks);
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch(error) {
      console.log(error);
    }
  }

  //bileşenin ilk yüklendiğinde
  // getAllTasks fonksiyonunu çağırır. Bu sayede, bileşen oluşturulduğunda görevler alınır.
  useEffect(() => {
    getAllTasks()
  },[]);

  // Metamask hesabıyla bağlantı kurmayı sağlar. Bu fonksiyon, Metamask'ın tarayıcıda
  // etkin olup olmadığını kontrol eder ve doğru ağa bağlı olup olmadığını kontrol eder.
  // Ardından, hesapları alır ve mevcut hesabı günceller.
  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        console.log('Metamask not detected')
        return
      }
      let chainId = await ethereum.request({ method: 'eth_chainId'})
      console.log('Connected to chain:' + chainId)

      const rinkebyChainId = '0x4'

      if (chainId !== rinkebyChainId) {
        alert('You are not connected to the Rinkeby Testnet!')
        return
      } else {
        setCorrectNetwork(true);
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

      console.log('Found account', accounts[0])
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log('Error connecting to metamask', error)
    }
  }

  // kullanıcının girdiği görevi akıllı sözleşmeye ekler. Bu fonksiyon,
  // Ethereum nesnesinin mevcut olup olmadığını kontrol eder ve ardından akıllı
  // sözleşme ile etkileşim sağlar. Görev başarıyla eklenirse, görevlerin güncellenmiş
  // hali state'e eklenir.
  const addTask= async (e)=>{
    e.preventDefault();

    let task = {
      'taskText': input,
      'isDeleted': false
    };

    try {
      const {ethereum} = window

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const TaskContract = new ethers.Contract(
            TaskContractAddress,
            TaskAbi.abi,
            signer
        )

        TaskContract.addTask(task.taskText, task.isDeleted)
            .then(response => {
              setTasks([...tasks, task]);
              console.log("Completed Task");
            })
            .catch(err => {
              console.log("Error occured while adding a new task");
            });
        ;
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch(error) {
      console.log("Error submitting new Tweet", error);
    }

    setInput('')
  };


  //belirli bir görevi silmek için kullanılır. Bu fonksiyon, Ethereum nesnesinin mevcut olup
  // olmadığını kontrol eder ve ardından akıllı sözleşme ile etkileşim sağlar. Görev başarıyla
  // silindikten sonra görevlerin güncellenmiş hali state'e eklenir.
  const deleteTask = key => async() => {
    console.log(key);

    // Now we got the key, let's delete our tweet
    try {
      const {ethereum} = window

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const TaskContract = new ethers.Contract(
            TaskContractAddress,
            TaskAbi.abi,
            signer
        )

        let deleteTaskTx = await TaskContract.deleteTask(key, true);
        let allTasks = await TaskContract.getMyTasks();
        setTasks(allTasks);
      } else {
        console.log("Ethereum objecti mevcut değil");
      }

    } catch(error) {
      console.log(error);
    }
  }

  return (
      <div>
        {currentAccount === '' ? (
            <button
                className='text-2xl font-bold py-3 px-12 bg-[#f1c232] rounded-lg mb-10 hover:scale-105 transition duration-500 ease-in-out'
                onClick={connectWallet}
            >
              Cüzdanı Bağla
            </button>
        ) : correctNetwork ? (
            <div className="App">
              <h2> Task Yönetimi Uygulaması</h2>
              <form>
                <TextField id="outlined-basic" label="Todo oluştur" variant="outlined" style={{margin:"0px 5px"}} size="small" value={input}
                           onChange={e=>setInput(e.target.value)} />
                <Button variant="contained" color="primary" onClick={addTask}  >Task Ekle</Button>
              </form>
              <ul>
                {tasks.map(item=>
                    <Task
                        key={item.id}
                        taskText={item.taskText}
                        onClick={deleteTask(item.id)}
                    />)
                }
              </ul>
            </div>
        ) : (
            <div className='flex flex-col justify-center items-center mb-20 font-bold text-2xl gap-y-3'>
              <div>----------------------------------------</div>
              <div>Lütfen Rinkeby Testnet'e bağlanın</div>
              <div>ve sayfayı yeniden yükleyin</div>
              <div>----------------------------------------</div>
            </div>
        )}
      </div>
  );
}

export default App;