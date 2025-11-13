import bittensor as bt

subtensor = bt.subtensor("local")
subnets = subtensor.all_subnets()
print(subnets[1])