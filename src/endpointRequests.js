

const SUBMIT_URL = `https://script.google.com/macros/s/AKfycbz06oglDixoI7bR5zzWfpmcTMdsQvreGI61gBS2n2dqw4zVX0rFFuaWu8KRIcrhxZX5CQ/exec`;
// const SUBMIT_URL = `localhost`;


// const VERIFICATION_URL = `https://script.google.com/macros/s/AKfycbzh53bDCNk8WW3i7DEq0OoaX0NmpJkqDCgPKUhA4gQhRQbYVapMx21ymw3YNB-Pe8Y/exec`
const VERIFICATION_URL = `https://script.google.com/macros/s/AKfycbz06oglDixoI7bR5zzWfpmcTMdsQvreGI61gBS2n2dqw4zVX0rFFuaWu8KRIcrhxZX5CQ/exec`

// const VERIFICATION_URL = `localhost`

export async function PUT_submitExperiment(params, base_64_blob) {
    const fname = `unikey_${params["pid"]}_${params["expType"]}_${params["timestamp_now"]}.zip`
    // Update Data is a JSON string
    try {
      const res = await fetch(SUBMIT_URL, {
        redirect: 'follow',
        method: "POST",
        body: JSON.stringify({
          "reqType": "submitResults",
          email: params["email"],
          filename: fname,
          expType: params["expType"],
          data: base_64_blob,
          updateData : params["updateData"]
        }),
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
      });
  
      const textResult = await res.text()
      console.log(textResult)
      return textResult === "ok"
    } catch (e) {
      console.log(e)
      return false
    }
  }

export async function PUT_verifyEmail(params) {
    try {
        const body = {"reqType": "getUser","email": params["email"], "pid": params["pid"]}

        const res = await fetch(VERIFICATION_URL, {
            redirect: 'follow',
            method: "POST",
            body: JSON.stringify(body),
            headers: {
            "Content-Type": "text/plain;charset=utf-8",
            },
        });

        const jsonResult = await res.text()
        console.log(jsonResult)
        const userData = JSON.parse(jsonResult)
        return userData
    } catch (e) {
        // console.log(e)
        const def = {
            "userEmail":null,
            "userFriendlyID":null,
            "status":"requestFailed"}
        return def
    }
  }



export async function PUT_getWords(params) {
  try {
    const body = {"reqType": "getWords","email": params["email"]}
    const res = await fetch(SUBMIT_URL, {
      redirect: 'follow',
      method: "POST",
      body:JSON.stringify(body),
      headers: {
      "Content-Type": "text/plain;charset=utf-8",
      },
    });

    const jsonResult = await res.text()
    const email = JSON.parse(jsonResult)
    return email
  } catch (e) {
    console.log(e)
    return false
  }
}

export async function PUT_requestEmail(params) {
    try {
      const res = await fetch(SUBMIT_URL, {
        redirect: 'follow',
        method: "POST",
        headers: {
        "Content-Type": "text/plain;charset=utf-8",
        },
      });
  
      const jsonResult = await res.text()
      const email = JSON.parse(jsonResult)["email"]
      console.log(email)
      return email
    } catch (e) {
      console.log(e)
      return false
    }
  }