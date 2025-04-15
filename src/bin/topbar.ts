

export namespace loadingBar {

    const bar = document.getElementById("progress-bar")!;
    let timeout: NodeJS.Timeout | undefined

    export const load = () => {
        if (timeout) {
            clearTimeout(timeout)
            timeout = undefined
        }
        bar.className = "load";

        setTimeout(() => {
            if (bar.className == "load") {
                finish();
            }
        }, 2048)
        
    }

    export const finish = () => {
        if (timeout) {
            clearTimeout(timeout)
            timeout = undefined
        }
        bar.className = "finish";
        timeout = setTimeout(() => bar.removeAttribute("class"), 516);
    }
}