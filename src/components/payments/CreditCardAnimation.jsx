import React, { useState, useMemo, useEffect } from "react";
import "./style.css";
import toast from "react-hot-toast";

const CreditCardAnimation = ({ amount, member, onPaymentSubmit }) => {

    const [cardNumberRaw, setCardNumberRaw] = useState("");
    const [cardName, setCardName] = useState("");
    const [cardMonth, setCardMonth] = useState("");
    const [cardYear, setCardYear] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [currentCardBackground, setCurrentCardBackground] = useState(1);

    useEffect(() => {
        setCurrentCardBackground(Math.floor(Math.random() * 25 + 1));
    }, []);

    const cardType = useMemo(() => {
        if (cardNumberRaw.startsWith("4")) return "visa";
        if (cardNumberRaw.startsWith("34") || cardNumberRaw.startsWith("37")) return "amex";
        if (/^5[1-5]/.test(cardNumberRaw)) return "mastercard";
        if (cardNumberRaw.startsWith("6011")) return "discover";
        if (cardNumberRaw.startsWith("9792")) return "troy";
        return "visa";
    }, [cardNumberRaw]);

    const handleNumberChange = (e) => {
        const raw = e.target.value.replace(/\D/g, "");
        const max = cardType === "amex" ? 15 : 16;
        setCardNumberRaw(raw.slice(0, max));
    };

    const handleCvvChange = (e) => {
        const raw = e.target.value.replace(/\D/g, "");
        const max = cardType === "amex" ? 4 : 3;
        setCardCvv(raw.slice(0, max));
    };

    const formattedInputNumber = useMemo(() => {
        let res = "";

        if (cardType === "amex") {
            for (let i = 0; i < cardNumberRaw.length; i++) {
                if (i === 4 || i === 10) res += " ";
                res += cardNumberRaw[i];
            }
        } else {
            for (let i = 0; i < cardNumberRaw.length; i++) {
                if (i > 0 && i % 4 === 0) res += " ";
                res += cardNumberRaw[i];
            }
        }

        return res;

    }, [cardNumberRaw, cardType]);

    const previewNumber = useMemo(() => {

        const mask = cardType === "amex"
            ? "#### ###### #####"
            : "#### #### #### ####";

        let res = "";
        let j = 0;

        for (let i = 0; i < mask.length; i++) {

            if (mask[i] === " ") {
                res += " ";
                continue;
            }

            if (j < cardNumberRaw.length) {

                if (j < 4 || (cardType === "amex" ? j >= 11 : j >= 12)) {
                    res += cardNumberRaw[j];
                } else {
                    res += "*";
                }

                j++;

            } else {
                res += "#";
            }

        }

        return res;

    }, [cardNumberRaw, cardType]);

    const handleSubmit = (e) => {

        e.preventDefault();

        const required = cardType === "amex" ? 15 : 16;

        if (cardNumberRaw.length !== required)
            return toast.error(`Card number must be ${required} digits`);

        if (!cardName)
            return toast.error("Card holder name required");

        if (!cardMonth || !cardYear)
            return toast.error("Expiration date required");

        const cvvReq = cardType === "amex" ? 4 : 3;

        if (cardCvv.length !== cvvReq)
            return toast.error(`CVV must be ${cvvReq} digits`);

        const data = {
            cardLast4: cardNumberRaw.slice(-4),
            cardName,
            cardType,
            expiryMonth: cardMonth,
            expiryYear: cardYear,
            cvvLength: cardCvv.length
        };

        if (onPaymentSubmit) {
            onPaymentSubmit(data);
        }

        toast.success("Payment Verified");

    };

    const minCardYear = new Date().getFullYear();
    const years = Array.from({ length: 13 }, (_, i) => minCardYear + i);
    const months = Array.from({ length: 12 }, (_, i) =>
        (i + 1).toString().padStart(2, "0")
    );

    return (

        <div className="payment-terminal">

            {/* CARD PREVIEW */}

            <div className="payment-terminal__preview">

                <div className={`card-item ${isCardFlipped ? "-active" : ""}`}>

                    {/* FRONT */}

                    <div className="card-item__side -front">

                        <div className="card-item__cover">
                            <img
                                src={`/images/payment-cards/${currentCardBackground}.jpeg`}
                                className="card-item__bg"
                                alt=""
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.style.background = 'linear-gradient(45deg, #1e293b, #334155)';
                                }}
                            />
                        </div>

                        <div className="card-item__wrapper">

                            <div className="card-item__top">

                                <img
                                    src="/images/payment-cards/chip.png"
                                    className="card-item__chip"
                                    alt=""
                                    onError={(e) => e.target.style.opacity = '0'}
                                />

                                <div className="card-item__type">
                                    <img
                                        src={`/images/payment-cards/${cardType}.png`}
                                        className="card-item__typeImg"
                                        alt=""
                                        onError={(e) => e.target.style.opacity = '0'}
                                    />
                                </div>

                            </div>

                            <label className="card-item__number">
                                {previewNumber}
                            </label>

                            <div className="card-item__content">

                                <div className="card-item__info">
                                    <div className="card-item__holder">Card Holder</div>
                                    <div className="card-item__name">{cardName || "FULL NAME"}</div>
                                </div>

                                <div className="card-item__date">
                                    <label className="card-item__dateTitle">Expires</label>
                                    <span>{cardMonth || "MM"}</span>/
                                    <span>{cardYear ? String(cardYear).slice(2, 4) : "YY"}</span>
                                </div>

                            </div>

                        </div>

                    </div>

                    {/* BACK */}

                    <div className="card-item__side -back">

                        <div className="card-item__cover">
                            <img
                                src={`/images/payment-cards/${currentCardBackground}.jpeg`}
                                className="card-item__bg"
                                alt=""
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.style.background = 'linear-gradient(45deg, #1e293b, #334155)';
                                }}
                            />
                        </div>

                        <div className="card-item__band"></div>

                        <div className="card-item__cvv">

                            <div className="card-item__cvvTitle">CVV</div>

                            <div className="card-item__cvvBand">
                                {cardCvv.split("").map((_, i) => (
                                    <span key={i}>*</span>
                                ))}
                            </div>

                            <div className="card-item__type">
                                <img
                                    src={`/images/payment-cards/${cardType}.png`}
                                    className="card-item__typeImg"
                                    alt=""
                                    onError={(e) => e.target.style.opacity = '0'}
                                />
                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* PAYMENT FORM */}

            <form onSubmit={handleSubmit} className="payment-terminal__form card-form__inner">

                <div className="card-input">

                    <label className="card-input__label">Card Number</label>

                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        className="card-input__input"
                        value={formattedInputNumber}
                        onChange={handleNumberChange}
                        onFocus={() => setIsCardFlipped(false)}
                        maxLength={cardType === "amex" ? 17 : 19}
                    />

                </div>

                <div className="card-input">

                    <label className="card-input__label">Card Holder</label>

                    <input
                        type="text"
                        className="card-input__input"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        onFocus={() => setIsCardFlipped(false)}
                        autoComplete="cc-name"
                    />

                </div>

                <div className="card-form__row">

                    <div className="card-form__col">

                        <label className="card-input__label">Expiration Date</label>

                        <div className="flex gap-2">

                            <select
                                className="card-input__input"
                                value={cardMonth}
                                onChange={(e) => setCardMonth(e.target.value)}
                            >
                                <option value="">MM</option>
                                {months.map(m => <option key={m}>{m}</option>)}
                            </select>

                            <select
                                className="card-input__input"
                                value={cardYear}
                                onChange={(e) => setCardYear(e.target.value)}
                            >
                                <option value="">YY</option>
                                {years.map(y => <option key={y}>{y}</option>)}
                            </select>

                        </div>

                    </div>

                    <div className="card-form__col -cvv">

                        <label className="card-input__label">CVV</label>

                        <input
                            type="text"
                            inputMode="numeric"
                            className="card-input__input"
                            value={cardCvv}
                            onChange={handleCvvChange}
                            onFocus={() => setIsCardFlipped(true)}
                            onBlur={() => setIsCardFlipped(false)}
                            autoComplete="cc-csc"
                            maxLength={cardType === "amex" ? 4 : 3}
                        />

                    </div>

                </div>

                <button type="submit" className="card-form__button">
                    {amount ? `Pay $${amount}` : "Submit Payment"}
                </button>

            </form>

        </div>

    );

};

export default CreditCardAnimation;