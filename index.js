
// async function start (){
    
// let success = 0;
// let failed = 0;

// let startAt;
// let endAt;
// startAt = Date.now()

// for (let i=0; i<1000;i++){
//     console.log("fetching",i)
//   const res = await fetch("http://localhost:5000/api/v1/books/public")
//   if(res.status === 200){
//     success++
//  }
//  else failed++
//   }

//   endAt = Date.now()
//  console.log(msToHMS(endAt-startAt))
// }
 

// start()


//  function msToHMS(ms){
//   const totalSeconds = Math.floor(ms / 1000);
//   const hours = Math.floor(totalSeconds / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const seconds = totalSeconds % 60;

//   return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
// }

// function pad(num) {
//   return num.toString().padStart(2, '0');
// }

const organizationData = {
  company: {
    name: "TechNova Inc.",
    founded: 2010,
    departments: {
      engineering: {
        head: "Alice Johnson",
        teams: {
          frontend: {
            lead: "David Lee",
            members: ["Sam", "Kim", "Ravi"]
          },
          backend: {
            lead: "Nina Patel",
            members: ["Tom", "Jake"]
          }
        }
      },
      marketing: {
        head: "Robert King",
        teams: {
          digital: {
            lead: "Sara L.",
            members: ["Ann", "Leo"]
          },
          offline: {
            lead: "Marcus V.",
            members: []
          }
        }
      }
    }
  },
  settings: {
    theme: "dark",
    notifications: {
      email: true,
      sms: false,
      push: {
        enabled: true,
        frequency: "daily"
      }
    },
    privacy: {
      tracking: false,
      dataSharing: {
        partners: false,
        analytics: true
      }
    }
  }
};
 const data = {

 }

function objFormat  (obj,parent=''){
  Object.entries(obj).forEach(([key,value])=>{
     parent += `${parent?'.':''}${key}`
    if(typeof value === 'object' && Object.values(value).length){
        objFormat(value,parent)
    }
    else  { 
      data[parent] = value
    }
  })
}
function flattenObject(obj, parent = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parent ? `${parent}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

// Example usage:
const nested = { a: { b: { c: 1 } }, d: 2 };
console.log(flattenObject(nested));
// Output: { "a.b.c": 1, "d": 2 }
