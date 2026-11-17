"""Scientific reference calculations for the Magnetism Lab (Python 3.10+)."""
from math import cos, radians, pi
MU0 = 4 * pi * 1e-7

def straight_wire_field(current_a: float, radius_m: float) -> float:
    if radius_m <= 0: raise ValueError("radius must be positive")
    return MU0 * abs(current_a) / (2 * pi * radius_m)

def circular_coil_field(current_a: float, turns: int, radius_m: float) -> float:
    if turns < 1 or radius_m <= 0: raise ValueError("turns and radius must be positive")
    return MU0 * turns * abs(current_a) / (2 * radius_m)

def solenoid_field(current_a: float, turns_per_m: float) -> float:
    if turns_per_m < 0: raise ValueError("turn density cannot be negative")
    return MU0 * turns_per_m * abs(current_a)

def magnetic_flux(field_t: float, area_m2: float, angle_deg: float) -> float:
    if area_m2 < 0: raise ValueError("area cannot be negative")
    return field_t * area_m2 * cos(radians(angle_deg))

if __name__ == "__main__":
    print("wire:", f"{straight_wire_field(2, .015):.6g} T")
    print("coil:", f"{circular_coil_field(2, 6, .125):.6g} T")
    print("solenoid:", f"{solenoid_field(2, 6/.28):.6g} T")
    print("flux:", f"{magnetic_flux(.5, .2, 60):.6g} Wb")
