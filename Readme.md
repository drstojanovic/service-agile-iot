# Code for RPI device

## Enabling script to run on device start up

1. Run 

 ```
 sudo nano /home/pi/.config/lxsession/LXDE-pi/autostart
 ```

to open file that contains commands that are executed at beggining.

2. Add at the botom of the file:

```
sleep 500
node /home/pi/Desktop/rpi/main.js &
```
