/**
 * Test del servizio email
 * 
 * Questo script consente di testare l'invio di email con Brevo e il sistema di fallback
 */
import { 
  sendWelcomeEmail, 
  sendPaymentConfirmationEmail, 
  sendTrialExpiringEmail, 
  sendSubscriptionEndedEmail, 
  sendPasswordResetEmail, 
  emailServiceStatus 
} from './email-service';

// Email di test - Utilizzare un'email valida per test reali
const TEST_EMAIL = "noreply.nutrieasy@gmail.com";
const TEST_USERNAME = "Utente Test";

// Funzione per stampare lo stato del servizio email
function printServiceStatus() {
  console.log("\n📊 STATO DEL SERVIZIO EMAIL:");
  console.log(`- Servizio attivo: ${emailServiceStatus.isActive ? '✅' : '❌'}`);
  console.log(`- Modalità: ${emailServiceStatus.mode}`);
  console.log(`- Ultimo errore: ${emailServiceStatus.lastError || 'Nessuno'}`);
  console.log(`- Numero di tentativi falliti: ${emailServiceStatus.failedAttempts}`);
  console.log(`- Data ultimo tentativo: ${emailServiceStatus.lastAttemptDate ? new Date(emailServiceStatus.lastAttemptDate).toLocaleString() : 'Mai'}`);
  console.log('----------------------------\n');
}

// Funzione per testare l'invio di email di benvenuto
async function testWelcomeEmail(email: string, username: string) {
  console.log(`⏳ Test email di benvenuto per ${username}...`);
  try {
    const result = await sendWelcomeEmail(email, username);
    console.log(`${result ? '✅' : '❌'} Email di benvenuto: ${result ? 'Inviata' : 'Fallita'}`);
    return result;
  } catch (error) {
    console.error("❌ Errore durante il test dell'email di benvenuto:", error);
    return false;
  }
}

// Funzione per testare l'invio di email di conferma pagamento
async function testPaymentConfirmationEmail(email: string, username: string) {
  console.log(`⏳ Test email di conferma pagamento per ${username}...`);
  try {
    const result = await sendPaymentConfirmationEmail(
      email, 
      username, 
      "Piano Premium Annuale", 
      "€39.99", 
      "22 Aprile 2026"
    );
    console.log(`${result ? '✅' : '❌'} Email di conferma pagamento: ${result ? 'Inviata' : 'Fallita'}`);
    return result;
  } catch (error) {
    console.error("❌ Errore durante il test dell'email di conferma pagamento:", error);
    return false;
  }
}

// Funzione per testare l'invio di email di scadenza della prova
async function testTrialExpiringEmail(email: string, username: string) {
  console.log(`⏳ Test email di scadenza prova per ${username}...`);
  try {
    const result = await sendTrialExpiringEmail(email, username, 2);
    console.log(`${result ? '✅' : '❌'} Email di scadenza prova: ${result ? 'Inviata' : 'Fallita'}`);
    return result;
  } catch (error) {
    console.error("❌ Errore durante il test dell'email di scadenza prova:", error);
    return false;
  }
}

// Funzione per testare l'invio di email di abbonamento terminato
async function testSubscriptionEndedEmail(email: string, username: string) {
  console.log(`⏳ Test email di abbonamento terminato per ${username}...`);
  try {
    const result = await sendSubscriptionEndedEmail(email, username);
    console.log(`${result ? '✅' : '❌'} Email di abbonamento terminato: ${result ? 'Inviata' : 'Fallita'}`);
    return result;
  } catch (error) {
    console.error("❌ Errore durante il test dell'email di abbonamento terminato:", error);
    return false;
  }
}

// Funzione per testare l'invio di email di reset password
async function testPasswordResetEmail(email: string, username: string) {
  console.log(`⏳ Test email di reset password per ${username}...`);
  try {
    const result = await sendPasswordResetEmail(email, username, "token-reset-123456");
    console.log(`${result ? '✅' : '❌'} Email di reset password: ${result ? 'Inviata' : 'Fallita'}`);
    return result;
  } catch (error) {
    console.error("❌ Errore durante il test dell'email di reset password:", error);
    return false;
  }
}

// Funzione principale di test
async function runEmailTests() {
  console.log("🚀 INIZIO TEST DEL SERVIZIO EMAIL");
  console.log("=================================");
  
  // Stampa lo stato iniziale del servizio
  printServiceStatus();
  
  // Test di tutte le tipologie di email
  let results = [];
  
  results.push(await testWelcomeEmail(TEST_EMAIL, TEST_USERNAME));
  printServiceStatus();
  
  results.push(await testPaymentConfirmationEmail(TEST_EMAIL, TEST_USERNAME));
  printServiceStatus();
  
  results.push(await testTrialExpiringEmail(TEST_EMAIL, TEST_USERNAME));
  printServiceStatus();
  
  results.push(await testSubscriptionEndedEmail(TEST_EMAIL, TEST_USERNAME));
  printServiceStatus();
  
  results.push(await testPasswordResetEmail(TEST_EMAIL, TEST_USERNAME));
  printServiceStatus();
  
  // Riepilogo finale
  console.log("\n📋 RIEPILOGO DEI TEST:");
  console.log(`- Test completati: ${results.length}`);
  console.log(`- Test riusciti: ${results.filter(r => r).length}`);
  console.log(`- Test falliti: ${results.filter(r => !r).length}`);
  console.log("\n✨ TEST COMPLETATI ✨");
}

// Esegui i test
runEmailTests().catch(console.error);