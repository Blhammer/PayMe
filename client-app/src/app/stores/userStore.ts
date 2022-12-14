import { makeAutoObservable, runInAction } from "mobx";
import { history } from "../..";
import { User, UserFormValues } from "../models/user";
import { store } from "./store";
import api from "../api/api";

export default class UserStore {
    user: User | null = null;
    refreshTokenTimeout: any;

    constructor() {
        makeAutoObservable(this);
    }

    get isLoggedIn() {
        return !!this.user;
    }

    login = async (creds: UserFormValues) => {
        try {
            const user = await api.Account.login(creds);

            store.commonStore.setToken(user.token);
            this.startRefreshTokenTimer(user);
            runInAction(() => (this.user = user));

            history.push("/dashboard");
            store.modalStore.closeModal();
        } catch (error) {
            throw error;
        }
    };

    logout = () => {
        store.commonStore.setToken(null);
        window.localStorage.removeItem("jwt");
        this.user = null;
        history.push("/");
    };

    getUser = async () => {
        try {
            const user = await api.Account.current();
            store.commonStore.setToken(user.token);
            runInAction(() => (this.user = user));
            this.startRefreshTokenTimer(user);
        } catch (error) {
            console.log(error);
        }
    };

    register = async (creds: UserFormValues) => {
        try {
            await api.Account.register(creds);

            history.push(`/account/registerSuccess?email=${creds.email}`);
            store.modalStore.closeModal();
        } catch (error) {
            throw error;
        }
    };

    setImage = (image: string) => {
        if (this.user) this.user.image = image;
    };

    setDisplayName = (name: string) => {
        if (this.user) this.user.firstName = name;
    };

    refreshToken = async () => {
        this.stopRefreshTokenTimer();

        try {
            const user = await api.Account.refreshToken();
            runInAction(() => (this.user = user));
            store.commonStore.setToken(user.token);
            this.startRefreshTokenTimer(user);
        } catch (error) {
            console.log(error);
        }
    };

    private startRefreshTokenTimer(user: User) {
        const jwtToken = JSON.parse(atob(user.token.split(".")[1]));
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - 60 * 1000;
        this.refreshTokenTimeout = setTimeout(this.refreshToken, timeout);
    }

    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }
}
