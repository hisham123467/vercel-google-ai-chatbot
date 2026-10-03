export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {messages}=req.body||{};
    if(!Array.isArray(messages)||messages.length===0) return res.status(400).json({error:"Messages are required"});

   const API_KEY = "AQ.Ab8RN6IRIhJecy_mTBq4v8GIKQMoG7Bh5qbxnu7rNBeAQdN4tg";
    const MODEL=process.env.GEMINI_MODEL||"gemini-2.0-flash";

    if(!API_KEY) return res.status(500).json({error:"GEMINI_API_KEY is missing in Vercel Environment Variables."});

    const contents=messages.slice(-20).map(m=>({
      role:m.role==="assistant"?"model":"user",
      parts:[{text:String(m.content||"").slice(0,12000)}]
    }));

    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;

    const response=await fetch(url,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":API_KEY},
      body:JSON.stringify({
        contents,
        generationConfig:{temperature:0.7,maxOutputTokens:2048}
      })
    });

    const raw=await response.text();
    let data=null;
    try{data=JSON.parse(raw)}catch{}

    if(!response.ok){
      return res.status(response.status).json({error:data?.error?.message||`Google AI request failed with status ${response.status}`});
    }

    const reply=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
    return res.status(200).json({reply});
  }catch(error){
    return res.status(500).json({error:"Server error: "+error.message});
  }
}
