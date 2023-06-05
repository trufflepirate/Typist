

function spinner() {
    return <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
  }

export default function ButtonWithLoadingSpinner(props) {
    const toolTipClass = props.toolTipClass;
    const toolTipText = props.toolTipText;
    const buttonCss = props.buttonCss;
    const buttonCallback = props.buttonCallback;
    const buttonText = props.buttonText;
    const isLoading = props.isLoading;
    const buttonVerifyOpacity = isLoading ? "opacity-0" : "opacity-100";
    const buttonSpinnerOpacity = isLoading ? "opacity-100" : "opacity-0";

    return (
            <div className={toolTipClass} data-tip={toolTipText}>
                <div className={buttonCss} onClick={buttonCallback}>
                    <div className="relative align-middle">
                        <a className={`${buttonVerifyOpacity}`}>{buttonText}</a>
                        <div className={`absolute inset-0 ${buttonSpinnerOpacity}`}>{spinner()}</div>
                    </div>
                </div>
            </div>

    )
}