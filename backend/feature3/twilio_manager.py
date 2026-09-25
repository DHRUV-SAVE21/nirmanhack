import os
from twilio.rest import Client

class TwilioManager:
    def __init__(self):
        self.sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        self.token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        self.from_phone = os.getenv("TWILIO_PHONE_NUMBER", "").strip()
        self.to_phone = os.getenv("FARMER_PHONE_NUMBER", "+919021935820").strip() # Default to user provided number or dummy
        
        if self.sid and self.token and self.from_phone:
            try:
                self.client = Client(self.sid, self.token)
                self.enabled = True
                print("[OK] Twilio Client Initialized.")
                print("[OK] Twilio Client Initialized.")
            except Exception as e:
                print(f"[WARN] Twilio Init Failed: {e}")
                self.enabled = False
        else:
            self.enabled = False
            print("[INFO] Twilio credentials missing. Using Mock SMS mode.")

    def send_sms(self, body, to_number=None):
        """Sends an SMS or prints to console if disabled."""
        target = to_number or self.to_phone
        if self.enabled:
            try:
                message = self.client.messages.create(
                    body=body,
                    from_=self.from_phone,
                    to=target
                )
                print(f"[SENT] SMS Sent via Twilio: {message.sid}")
                return {"status": "sent", "sid": message.sid}
            except Exception as e:
                print(f"[ERROR] SMS Failed: {e}")
                return {"status": "failed", "error": str(e)}
        else:
            print(f"[MOCK SMS] To: {target} | Body: {body}")
            return {"status": "mock_sent", "body": body}

    def make_call(self, to_number):
        """Initiates a Twilio Call with a simple message."""
        if self.enabled:
            try:
                # We use a simple TwiML to speak to the person who answers
                call = self.client.calls.create(
                    twiml=f'<Response><Say voice="alice">Namaste. This is an automated consultation call from Annadata Saathi. A farmer needs assistance regarding their crop health.</Say></Response>',
                    from_=self.from_phone,
                    to=to_number
                )
                print(f"[CALL] Initiated via Twilio: {call.sid}")
                return {"status": "called", "sid": call.sid}
            except Exception as e:
                error_str = str(e)
                print(f"[ERROR] Call Failed: {e}")
                
                # Fallback for Trial Accounts with unverified numbers
                if "unverified" in error_str.lower() or "trial account" in error_str.lower():
                    print("[WARN] Falling back to Mock Call due to Trial Account limitations.")
                    return {
                        "status": "mock_called", 
                        "to": to_number, 
                        "message": f"[OK] Demo Mode: Consultation request logged for {to_number}",
                        "note": "To enable real calls, verify this number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                    }
                
                return {"status": "failed", "error": error_str}
        else:
            print(f"[MOCK CALL] To: {to_number} | Message: Automated consultation request.")
            return {
                "status": "mock_called", 
                "to": to_number,
                "message": f"[OK] Demo Mode: Consultation would be initiated to {to_number}"
            }

