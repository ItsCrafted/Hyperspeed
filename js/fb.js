import{initializeApp}from"https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import{getAnalytics}from"https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import{getFirestore,collection,doc,setDoc,deleteDoc,getDocs,addDoc,query,orderBy,limit,writeBatch,serverTimestamp}from"https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut,updateProfile,updatePassword as fbUPw}from"https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

let cfg;
try{
  const res=await fetch('https://hyperspeed-fb.cgamz.online',{method:'GET',credentials:'omit'});
  if(!res.ok)throw new Error(`config fetch failed: ${res.status}`);
  cfg=await res.json();
}catch(e){
  console.error('[firebase] could not load config:',e);
  throw e;
}

const app=initializeApp(cfg);getAnalytics(app);
const db=getFirestore(app),auth=getAuth(app);
const bid=url=>btoa(unescape(encodeURIComponent(url))).replace(/[^a-zA-Z0-9]/g,'').slice(0,60);
window._db={
  async getBm(){const s=await getDocs(query(collection(db,'bookmarks'),orderBy('createdAt','asc')));return s.docs.map(d=>({id:d.id,...d.data()}))},
  async addBm(b){await setDoc(doc(db,'bookmarks',bid(b.url)),{url:b.url,title:b.title,favicon:b.favicon,createdAt:serverTimestamp()})},
  async delBm(url){await deleteDoc(doc(db,'bookmarks',bid(url)))},
  async addHist(e){await addDoc(collection(db,'history'),{url:e.url,title:e.title,visitedAt:serverTimestamp()})},
  async getHist(n=60){const s=await getDocs(query(collection(db,'history'),orderBy('visitedAt','desc'),limit(n)));return s.docs.map(d=>({id:d.id,...d.data()}))},
  async clearHist(){const s=await getDocs(collection(db,'history'));const b=writeBatch(db);s.docs.forEach(d=>b.delete(d.ref));await b.commit();},
  async getPrefs(){try{const s=await getDocs(collection(db,'prefs'));const out={};s.docs.forEach(d=>out[d.id]=d.data().value);return out;}catch{return{};}},
  async setPref(key,value){await setDoc(doc(db,'prefs',key),{value});}
};
window._dbReady=true;window.dispatchEvent(new Event('db-ready'));
window._auth=auth;
const fe=c=>({'auth/invalid-email':'invalid email','auth/user-not-found':'no account found','auth/wrong-password':'incorrect password','auth/invalid-credential':'incorrect email or password','auth/email-already-in-use':'email already in use','auth/weak-password':'password too weak (min 6)','auth/too-many-requests':'too many attempts — try later','auth/requires-recent-login':'sign out and back in first'}[c]||c);
onAuthStateChanged(auth,user=>{window._cu=user;if(window.updateAcctUI)window.updateAcctUI(user);});
window.doSignIn=async function(){
  const e=document.getElementById('si-email').value.trim(),p=document.getElementById('si-pw').value,btn=document.getElementById('si-btn'),err=document.getElementById('si-err');
  err.textContent='';btn.disabled=true;
  try{await signInWithEmailAndPassword(auth,e,p);closeModal();toast('Signed in','fa-solid fa-circle-user');}
  catch(x){err.textContent=fe(x.code);}finally{btn.disabled=false;}
};
window.doRegister=async function(){
  const n=document.getElementById('reg-name').value.trim(),e=document.getElementById('reg-email').value.trim(),p=document.getElementById('reg-pw').value,btn=document.getElementById('reg-btn'),err=document.getElementById('reg-err');
  err.textContent='';if(!n){err.textContent='display name required';return;}btn.disabled=true;
  try{const c=await createUserWithEmailAndPassword(auth,e,p);await updateProfile(c.user,{displayName:n});closeModal();toast('Welcome!','fa-solid fa-star');}
  catch(x){err.textContent=fe(x.code);}finally{btn.disabled=false;}
};
window.doSignOut=async function(){await signOut(auth);closeModal();toast('Signed out','fa-solid fa-arrow-right-from-bracket');};
window.updateName=async function(){
  const n=document.getElementById('new-name').value.trim(),err=document.getElementById('u-err');err.textContent='';if(!n)return;
  try{await updateProfile(auth.currentUser,{displayName:n});window.updateAcctUI(auth.currentUser);document.getElementById('new-name').value='';toast('Name updated','fa-solid fa-user');}
  catch(x){err.textContent=fe(x.code);}
};
window.updatePw=async function(){
  const p=document.getElementById('new-pw').value,err=document.getElementById('u-err');err.textContent='';
  if(p.length<6){err.textContent='min 6 characters';return;}
  try{await fbUPw(auth.currentUser,p);document.getElementById('new-pw').value='';toast('Password updated','fa-solid fa-lock');}
  catch(x){err.textContent=fe(x.code);}
};