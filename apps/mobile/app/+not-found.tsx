import { Redirect } from 'expo-router';

/** Legacy `views[view]` missing → Home (index.html 2109). */
export default function NotFound() {
  return <Redirect href="/" />;
}
