type MyAppColor = "green" | "red" | "orange" | "yellow" | "pink";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline";
    primaryColor?: MyAppColor;
  };
  
  const primaryBgClass: Record<MyAppColor, string> = {
    green: "bg-myApp-green hover:bg-myApp-green/80",
    red: "bg-myApp-red hover:bg-myApp-red/80",
    orange: "bg-myApp-orange hover:bg-myApp-orange/80",
    yellow: "bg-myApp-yellow hover:bg-myApp-yellow/80",
    pink: "bg-myApp-pink hover:bg-myApp-pink/80",
  };

  export default function Button({ variant = "outline", primaryColor = "green", className = "", ...props }: ButtonProps) {
    const base =
      "px-4 py-1.5 text-button font-medium rounded-4xl transition-colors";
  
    const variants = {
      primary: `${primaryBgClass[primaryColor]} border-2 border-myApp-green text-button font-semiBold text-myApp-cream`,
      outline: "border-2 border-myApp-red text-button font-semiBold text-myApp-red hover:bg-myApp-red hover:text-myApp-cream",
    };
  
    return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
  }