from typing import List, Dict, Any
import asyncio
from cachetools import TTLCache
import bittensor as bt

# Simple in-process caches to reduce RPC load
_subnets_cache = TTLCache(maxsize=1, ttl=30)  # list of subnets, 30s
_info_cache = TTLCache(maxsize=64, ttl=30)  # per-netuid, 30s


def _get_subtensor(network: str = "finney"):
    # Network can be made configurable via env if needed
    return bt.subtensor(network=network)


def _to_primitive(value: Any) -> Any:
    """
    Convert Bittensor Balance and nested containers into JSON-serializable primitives.
    - Balance -> float(balance.tao)
    - lists/tuples/dicts -> recursively convert
    """
    try:
        from bittensor.utils.balance import Balance as BtBalance  # type: ignore
    except Exception:
        BtBalance = None  # type: ignore

    if BtBalance is not None and isinstance(value, BtBalance):  # type: ignore
        # Prefer returning a float TAO amount for API consumers
        try:
            return float(value.tao)  # type: ignore[attr-defined]
        except Exception:
            try:
                return float(value)  # fallback if .tao missing
            except Exception:
                return str(value)

    if isinstance(value, (list, tuple)):
        return [_to_primitive(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_primitive(v) for k, v in value.items()}
    return value


async def get_all_subnets_summary(network: str = "finney") -> Dict[int, Dict[str, Any]]:
    cache_key = f"subnets:{network}"
    if cache_key in _subnets_cache:
        return _subnets_cache[cache_key]

    subtensor = _get_subtensor(network)
    subnets = subtensor.all_subnets()

    results: Dict[int, Dict[str, Any]] = {}
    for subnet in subnets:
        netuid = subnet.netuid
        subnet_name = getattr(subnet, "subnet_name", None) or getattr(subnet, "name", None)
        price = _to_primitive(getattr(subnet, "price", None) or getattr(subnet, "moving_price", None))
        owner_coldkey = getattr(subnet, "owner_coldkey", None) or getattr(subnet, "owner", None)
        alpha_in = _to_primitive(getattr(subnet, "alpha_in", None))
        alpha_out = _to_primitive(getattr(subnet, "alpha_out", None))
        tao_in = _to_primitive(getattr(subnet, "tao_in", None))
        tao_in_emission = _to_primitive(getattr(subnet, "tao_in_emission", None))

        results[netuid] = {
            "netuid": netuid,
            "subnet_name": subnet_name,
            "price": price,
            "tao_in_emission": tao_in_emission,
            "owner_coldkey": owner_coldkey,
            "alpha_in": alpha_in,
            "alpha_out": alpha_out,
            "tao_in": tao_in,
        }

    _subnets_cache[cache_key] = results
    return results


async def get_subnet_info(netuid: int, network: str = "finney") -> Dict[str, Any]:
    cache_key = f"subnet:{netuid}:{network}"
    if cache_key in _info_cache:
        return _info_cache[cache_key]

    subtensor = _get_subtensor(network)
    info = subtensor.get_subnet_info(netuid)
    return info