import serial
import time

# Change COM3 to your Arduino port
arduino = serial.Serial('COM3', 9600, timeout=1)
time.sleep(2)

def pump_on():
    arduino.write(b'1')
    print(" Pump ON")

def pump_off():
    arduino.write(b'0')
    print(" Pump OFF")

# Test
if __name__ == "__main__":
    pump_on()
    time.sleep(5)
    pump_off()
