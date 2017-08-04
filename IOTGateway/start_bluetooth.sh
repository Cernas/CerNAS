cd /lib/bluetooth/rtl8723bs_bt
sudo modprobe rfkill-actions_8723bs
sleep 1
sudo ./start_bt.sh

exit 0
