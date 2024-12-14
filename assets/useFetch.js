export function useFetch(url, type = 'json') {
  const [data, setData] = React.useState(undefined);
  const [error, setError] = React.useState(undefined);
  React.useEffect(() => {
    async function retrieve() {
      const result = await fetch(url);
      if (result.ok) {
        setData(await result[type]());
      } else {
        setError(`error ${result.status} fetching ${url}`);
      }
    }
    retrieve();
  }, [url]);

  return { data, error };
}
