import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  const colRef = collection(db, 'sites_index');
  const snap = await getDocs(colRef);
  console.log(`Total documents in sites_index: ${snap.size}`);
  const ids: string[] = [];
  snap.forEach(doc => {
    ids.push(doc.id);
  });
  console.log('Site IDs in sites_index:', ids.sort());
}

main().catch(console.error);
