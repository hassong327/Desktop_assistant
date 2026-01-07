use std::sync::Mutex;
use tauri::{
    Emitter, Manager,
    menu::{Menu, MenuItem, Submenu, PredefinedMenuItem},
    tray::TrayIconBuilder,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum InteractionMode {
    #[serde(rename = "passthrough")]
    Passthrough,
    #[serde(rename = "interactive")]
    Interactive,
    #[serde(rename = "ghost")]
    Ghost,
}

impl Default for InteractionMode {
    fn default() -> Self {
        InteractionMode::Interactive
    }
}

impl InteractionMode {
    fn next(&self) -> Self {
        match self {
            InteractionMode::Interactive => InteractionMode::Passthrough,
            InteractionMode::Passthrough => InteractionMode::Ghost,
            InteractionMode::Ghost => InteractionMode::Interactive,
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ChatResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub struct AppState {
    pub interaction_mode: Mutex<InteractionMode>,
    pub character_size: Mutex<u32>,
    pub chat_history: Mutex<Vec<ChatMessage>>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct OllamaRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
}

#[derive(Debug, serde::Deserialize)]
struct OllamaResponse {
    message: Option<OllamaMessage>,
}

#[derive(Debug, serde::Deserialize)]
struct OllamaMessage {
    content: String,
}

const SYSTEM_PROMPT: &str = r#"너는 개발자의 데스크톱 펫이야. 이름은 "코디"(Cody)야.

성격:
- 친근하고 귀엽게 말해 (반말 사용)
- 이모지를 적당히 사용해
- 개발 관련 질문에 도움을 줄 수 있어
- 짧고 간결하게 대답해 (2-3문장)
- 가끔 귀여운 리액션을 해 (예: "우와!", "헤헤", "음...")

규칙:
- 한국어로 대답해
- 너무 길게 설명하지 마
- 모르는 건 솔직하게 말해"#;

mod commands {
    use super::*;
    use tauri::{AppHandle, WebviewWindow};

    #[tauri::command]
    pub fn set_ignore_mouse_events(window: WebviewWindow, ignore: bool) -> Result<(), String> {
        window
            .set_ignore_cursor_events(ignore)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn start_drag(window: WebviewWindow) -> Result<(), String> {
        window.start_dragging().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn get_interaction_mode(state: tauri::State<'_, AppState>) -> InteractionMode {
        state.interaction_mode.lock().unwrap().clone()
    }

    #[tauri::command]
    pub fn set_interaction_mode(
        app: AppHandle,
        state: tauri::State<'_, AppState>,
        mode: InteractionMode,
    ) -> Result<(), String> {
        *state.interaction_mode.lock().unwrap() = mode.clone();
        app.emit("interaction-mode-changed", mode)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn get_character_size(state: tauri::State<'_, AppState>) -> u32 {
        *state.character_size.lock().unwrap()
    }

    #[tauri::command]
    pub fn set_character_size(state: tauri::State<'_, AppState>, size: u32) {
        *state.character_size.lock().unwrap() = size;
    }

    #[tauri::command]
    pub async fn chat(state: tauri::State<'_, AppState>, message: String) -> Result<ChatResponse, String> {
        let messages = {
            let mut history = state.chat_history.lock().unwrap();
            history.push(ChatMessage {
                role: "user".to_string(),
                content: message.clone(),
            });

            let mut msgs = vec![ChatMessage {
                role: "system".to_string(),
                content: SYSTEM_PROMPT.to_string(),
            }];

            let start = if history.len() > 10 { history.len() - 10 } else { 0 };
            msgs.extend(history[start..].to_vec());
            msgs
        };

        let client = reqwest::Client::new();
        let request = OllamaRequest {
            model: "llama3.2".to_string(),
            messages,
            stream: false,
        };

        let result = client
            .post("http://localhost:11434/api/chat")
            .json(&request)
            .send()
            .await;

        match result {
            Ok(response) => {
                if response.status().is_success() {
                    match response.json::<OllamaResponse>().await {
                        Ok(ollama_response) => {
                            if let Some(msg) = ollama_response.message {
                                let mut history = state.chat_history.lock().unwrap();
                                history.push(ChatMessage {
                                    role: "assistant".to_string(),
                                    content: msg.content.clone(),
                                });
                                Ok(ChatResponse {
                                    success: true,
                                    response: Some(msg.content),
                                    error: None,
                                })
                            } else {
                                Ok(ChatResponse {
                                    success: false,
                                    response: None,
                                    error: Some("Empty response from Ollama".to_string()),
                                })
                            }
                        }
                        Err(e) => Ok(ChatResponse {
                            success: false,
                            response: None,
                            error: Some(format!("Failed to parse response: {}", e)),
                        }),
                    }
                } else {
                    Ok(ChatResponse {
                        success: false,
                        response: None,
                        error: Some(format!("Ollama returned status: {}", response.status())),
                    })
                }
            }
            Err(e) => Ok(ChatResponse {
                success: false,
                response: None,
                error: Some(format!("Failed to connect to Ollama: {}", e)),
            }),
        }
    }

    #[tauri::command]
    pub fn toggle_chat(app: AppHandle) -> Result<(), String> {
        if let Some(chat_window) = app.get_webview_window("chat") {
            if chat_window.is_visible().unwrap_or(false) {
                chat_window.hide().map_err(|e| e.to_string())?;
            } else {
                chat_window.show().map_err(|e| e.to_string())?;
                chat_window.set_focus().map_err(|e| e.to_string())?;
            }
        } else {
            let chat_window = tauri::WebviewWindowBuilder::new(
                &app,
                "chat",
                tauri::WebviewUrl::App("chat.html".into()),
            )
            .title("Chat")
            .inner_size(380.0, 500.0)
            .decorations(false)
            .always_on_top(true)
            .visible(true)
            .build()
            .map_err(|e| e.to_string())?;

            let _ = chat_window.set_focus();
        }
        Ok(())
    }

    #[tauri::command]
    pub fn close_chat(app: AppHandle) -> Result<(), String> {
        if let Some(chat_window) = app.get_webview_window("chat") {
            chat_window.hide().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(AppState {
            interaction_mode: Mutex::new(InteractionMode::default()),
            character_size: Mutex::new(200),
            chat_history: Mutex::new(Vec::new()),
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_ignore_mouse_events,
            commands::start_drag,
            commands::get_interaction_mode,
            commands::set_interaction_mode,
            commands::get_character_size,
            commands::set_character_size,
            commands::chat,
            commands::toggle_chat,
            commands::close_chat,
        ])
        .setup(|app| {
            let shortcut: Shortcut = "CommandOrControl+Shift+D".parse().unwrap();
            let app_handle = app.handle().clone();

            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |_app, _shortcut, event| {
                        if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                            let state = app_handle.state::<AppState>();
                            let current_mode = state.interaction_mode.lock().unwrap().clone();
                            let new_mode = current_mode.next();
                            *state.interaction_mode.lock().unwrap() = new_mode.clone();
                            let _ = app_handle.emit("interaction-mode-changed", new_mode);
                        }
                    })
                    .build(),
            )?;

            app.global_shortcut().register(shortcut)?;

            let size_100 = MenuItem::with_id(app, "size_100", "100px", true, None::<&str>)?;
            let size_150 = MenuItem::with_id(app, "size_150", "150px", true, None::<&str>)?;
            let size_200 = MenuItem::with_id(app, "size_200", "200px ✓", true, None::<&str>)?;
            let size_300 = MenuItem::with_id(app, "size_300", "300px", true, None::<&str>)?;
            let size_400 = MenuItem::with_id(app, "size_400", "400px", true, None::<&str>)?;

            let size_menu = Submenu::with_items(
                app,
                "캐릭터 크기",
                true,
                &[&size_100, &size_150, &size_200, &size_300, &size_400],
            )?;

            let mode_interactive = MenuItem::with_id(app, "mode_interactive", "Interactive ✓", true, None::<&str>)?;
            let mode_passthrough = MenuItem::with_id(app, "mode_passthrough", "Passthrough", true, None::<&str>)?;
            let mode_ghost = MenuItem::with_id(app, "mode_ghost", "Ghost", true, None::<&str>)?;

            let mode_menu = Submenu::with_items(
                app,
                "모드",
                true,
                &[&mode_interactive, &mode_passthrough, &mode_ghost],
            )?;

            let separator = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&size_menu, &mode_menu, &separator, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    let id = event.id.as_ref();
                    match id {
                        "quit" => {
                            app.exit(0);
                        }
                        "size_100" | "size_150" | "size_200" | "size_300" | "size_400" => {
                            let size: u32 = id.strip_prefix("size_").unwrap().parse().unwrap();
                            let state = app.state::<AppState>();
                            *state.character_size.lock().unwrap() = size;
                            let _ = app.emit("character-size-changed", size);
                        }
                        "mode_interactive" => {
                            let state = app.state::<AppState>();
                            *state.interaction_mode.lock().unwrap() = InteractionMode::Interactive;
                            let _ = app.emit("interaction-mode-changed", InteractionMode::Interactive);
                        }
                        "mode_passthrough" => {
                            let state = app.state::<AppState>();
                            *state.interaction_mode.lock().unwrap() = InteractionMode::Passthrough;
                            let _ = app.emit("interaction-mode-changed", InteractionMode::Passthrough);
                        }
                        "mode_ghost" => {
                            let state = app.state::<AppState>();
                            *state.interaction_mode.lock().unwrap() = InteractionMode::Ghost;
                            let _ = app.emit("interaction-mode-changed", InteractionMode::Ghost);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("pet") {
                    let _ = window.open_devtools();
                }
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
