

const SUBMIT_URL = `https://script.google.com/macros/s/AKfycbz06oglDixoI7bR5zzWfpmcTMdsQvreGI61gBS2n2dqw4zVX0rFFuaWu8KRIcrhxZX5CQ/exec`;
// const SUBMIT_URL = `localhost`;


const VERIFICATION_URL = `https://script.google.com/macros/s/AKfycbz06oglDixoI7bR5zzWfpmcTMdsQvreGI61gBS2n2dqw4zVX0rFFuaWu8KRIcrhxZX5CQ/exec`
// const VERIFICATION_URL = `localhost`

export async function PUT_submitExperiment(params, base_64_blob) {
    const fname = `unikey_${params["pid"]}_${params["expType"]}_${params["timestamp_now"]}.zip`
    try {
      const res = await fetch(SUBMIT_URL, {
        redirect: 'follow',
        method: "POST",
        body: JSON.stringify({
          pid: params["pid"],
          fname: fname,
          expType: params["expType"],
          data: base_64_blob,
        }),
        headers: {
          "Content-Type": "text/plain",
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
        const body = {"email": params["email"], "pid": params["pid"]}

        const res = await fetch(VERIFICATION_URL, {
            redirect: 'follow',
            method: "POST",
            body: JSON.stringify(body),
            headers: {
            "Content-Type": "text/plain",
            },
        });

        const jsonResult = await res.text()
        const userData = JSON.parse(jsonResult)
        console.log(userData)
        return userData
    } catch (e) {
        // console.log(e)
        return null
    }
  }
export async function PUT_requestEmail(params) {
    try {
      const res = await fetch(SUBMIT_URL, {
        redirect: 'follow',
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
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