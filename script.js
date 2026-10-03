const chat=document.getElementById("chat");
const form=document.getElementById("chatForm");
const input=document.getElementById("messageInput");
const sendBtn=document.getElementById("sendBtn");
const clearBtn=document.getElementById("clearBtn");
let messages=[];

function addMessage(role,text){
  const row=document.createElement("div");
  row.className="message "+role;
  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.textContent=text;
  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop=chat.scrollHeight;
  return row;
}

clearBtn.onclick=()=>{messages=[];chat.innerHTML="";addMessage("assistant","Chat cleared. Ask me anything.");};

input.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit();}
});

form.onsubmit=async(e)=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text||sendBtn.disabled)return;
  addMessage("user",text);
  messages.push({role:"user",content:text});
  input.value="";
  sendBtn.disabled=true;
  const thinking=addMessage("assistant","Thinking...");
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages})});
    const d=await r.json();
    thinking.remove();
    if(!r.ok) throw new Error(d.error||"Request failed");
    const reply=d.reply||"No response";
    addMessage("assistant",reply);
    messages.push({role:"assistant",content:reply});
  }catch(err){
    thinking.remove();
    addMessage("assistant","Error: "+err.message);
  }finally{
    sendBtn.disabled=false;
    input.focus();
  }
};