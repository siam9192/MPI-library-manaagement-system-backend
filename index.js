
async function start (){
    
let success = 0;
let failed = 0;

let startAt;
let endAt;
startAt = Date.now()

for (let i=0; i<1000;i++){
    console.log("fetching",i)
  const res = await fetch("http://localhost:5000/api/v1/books/public")
  if(res.status === 200){
    success++
 }
 else failed++
  }

  endAt = Date.now()
 console.log(msToHMS(endAt-startAt))
}
 

start()


 function msToHMS(ms){
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(num) {
  return num.toString().padStart(2, '0');
}

