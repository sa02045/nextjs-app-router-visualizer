interface Props {
  onNext: () => void;
}
export function Component(props: Props) {
  return (
    <div>
      <h1>Product Detail Page</h1>
      <button onClick={props.onNext}>Go to Home</button>
    </div>
  );
}
