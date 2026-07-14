import csv
import math
from pathlib import Path

def get_nearby_locations(target_name: str, csv_path: str, limit: int = 5, base_dir: str = ".") -> str:
    """
    Calculates the closest locations to a target using X/Y coordinates from an Azgaar CSV.
    """
    base_path = Path(base_dir).resolve()
    target_csv = (base_path / csv_path).resolve()
    
    if not target_csv.is_relative_to(base_path) or not target_csv.exists():
        return f"Error: Cannot locate CSV file at {csv_path}"
        
    locations = []
    target_data = None
    
    try:
        with open(target_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            # Ensure the CSV has the required Azgaar coordinate columns
            if 'x' not in reader.fieldnames or 'y' not in reader.fieldnames:
                return "Error: CSV does not contain 'x' and 'y' coordinate columns."
                
            # Column name for the city/location usually varies slightly in Azgaar ('Burg', 'Name', etc.)
            name_col = 'Burg' if 'Burg' in reader.fieldnames else reader.fieldnames[0]
            
            for row in reader:
                name = row.get(name_col, "Unknown")
                try:
                    x, y = float(row['x']), float(row['y'])
                except ValueError:
                    continue
                    
                loc_data = {"name": name, "x": x, "y": y, "data": row}
                locations.append(loc_data)
                
                if name.lower() == target_name.lower():
                    target_data = loc_data

        if not target_data:
            return f"Error: Could not find '{target_name}' in the database."

        # Calculate Euclidean distance for all other locations
        results = []
        for loc in locations:
            if loc["name"] == target_data["name"]:
                continue
            
            dist = math.sqrt((loc["x"] - target_data["x"])**2 + (loc["y"] - target_data["y"])**2)
            results.append((dist, loc))
            
        # Sort by closest distance
        results.sort(key=lambda item: item[0])
        
        # Format the output for the AI
        output = [f"--- Geographic scan originating from {target_data['name']} ---"]
        for i in range(min(limit, len(results))):
            dist, loc = results[i]
            # Provide surrounding context (State, Culture, Population) if available
            state = loc['data'].get('State', 'Unknown Region')
            pop = loc['data'].get('Population', 'Unknown')
            output.append(f"{i+1}. {loc['name']} (Distance Units: {dist:.1f}) | State: {state} | Population: {pop}")
            
        return "\n".join(output)

    except Exception as e:
        return f"System error processing coordinates: {str(e)}"