import { CATEGORIES } from '../api.js';

export default function ActivityOptions() {
  return Object.entries(CATEGORIES).map(([category, games]) => (
    <optgroup key={category} label={category}>
      {games.map((g) => (
        <option key={g}>{g}</option>
      ))}
    </optgroup>
  ));
}
