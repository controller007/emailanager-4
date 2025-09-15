"use client"

import type React from "react"

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import Strike from "@tiptap/extension-strike"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import FontFamily from "@tiptap/extension-font-family"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/app/_components/ui/dropdown-menu"
import { Separator } from "@/app/_components/ui/separator"
import {
    Bold,
    Italic,
    UnderlineIcon,
    List,
    ListOrdered,
    Link2,
    ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    TextIcon,
    Undo,
    Redo,
    PilcrowSquare,
    Palette,
    Highlighter,
    Strikethrough,
    SubscriptIcon,
    SuperscriptIcon,
    TableIcon,
    CheckSquare,
    Minus,
    Type,
} from "lucide-react"
import { useState, useEffect } from "react"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
}

// Create extensions
const TextSize = TextStyle.configure()

const MenuButton = ({
    onClick,
    active,
    children,
    title,
    disabled = false,
}: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title?: string
    disabled?: boolean
}) => (
    <Button
        type="button"
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`text-black h-8 w-8 ${active ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9] disabled:opacity-50 disabled:cursor-not-allowed`}
        variant="ghost"
        size="icon"
    >
        {children}
    </Button>
)

const LinkPopover = ({ editor }: { editor: any }) => {
    const [url, setUrl] = useState("")

    const addLink = () => {
        if (url) {
            editor.chain().focus().setLink({ href: url }).run()
        }
        setUrl("")
    }

    const removeLink = () => {
        editor.chain().focus().unsetLink().run()
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    className={`text-black h-8 w-8 ${editor.isActive("link") ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9]`}
                    title="Insert link"
                    variant="ghost"
                    size="icon"
                >
                    <Link2 className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2">
                    <div className="flex space-x-2">
                        <Input
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    addLink()
                                    e.preventDefault()
                                }
                            }}
                        />
                        <Button type="button" onClick={addLink}>
                            Add
                        </Button>
                    </div>
                    {editor.isActive("link") && (
                        <Button type="button" variant="outline" onClick={removeLink} className="w-full">
                            Remove Link
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

const ImagePopover = ({ editor }: { editor: any }) => {
    const [url, setUrl] = useState("")

    const addImage = () => {
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
        setUrl("")
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    className="text-black h-8 w-8 hover:bg-[#f9f9f9]"
                    title="Insert image"
                    variant="ghost"
                    size="icon"
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex space-x-2">
                    <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                addImage()
                                e.preventDefault()
                            }
                        }}
                    />
                    <Button type="button" onClick={addImage}>
                        Add
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const ColorPopover = ({ editor }: { editor: any }) => {
    const colors = [
        "#000000",
        "#343A40",
        "#495057",
        "#868E96",
        "#ADB5BD",
        "#E03131",
        "#C2255C",
        "#9C36B5",
        "#6741D9",
        "#3B5BDB",
        "#1971C2",
        "#0C8599",
        "#099268",
        "#2B8A3E",
        "#5C940D",
        "#E67700",
        "#D9480F",
    ]

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    className="text-black h-8 w-8 hover:bg-[#f9f9f9]"
                    title="Text color"
                    variant="ghost"
                    size="icon"
                >
                    <Palette className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                        <button
                            key={color}
                            className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                editor.chain().focus().setColor(color).run()
                            }}
                        />
                    ))}
                    <button
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                        onClick={() => {
                            editor.chain().focus().unsetColor().run()
                        }}
                    >
                        <span className="text-xs">×</span>
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const HighlightPopover = ({ editor }: { editor: any }) => {
    const highlightColors = [
        "#FFEB3B",
        "#FFC107",
        "#FF9800",
        "#FF5722",
        "#F44336",
        "#E91E63",
        "#9C27B0",
        "#673AB7",
        "#3F51B5",
        "#2196F3",
        "#03A9F4",
        "#00BCD4",
        "#009688",
        "#4CAF50",
        "#8BC34A",
        "#CDDC39",
    ]

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    className={`text-black h-8 w-8 ${editor.isActive("highlight") ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9]`}
                    title="Highlight"
                    variant="ghost"
                    size="icon"
                >
                    <Highlighter className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="grid grid-cols-4 gap-2">
                    {highlightColors.map((color) => (
                        <button
                            key={color}
                            className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                editor.chain().focus().toggleHighlight({ color }).run()
                            }}
                        />
                    ))}
                    <button
                        className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                        onClick={() => {
                            editor.chain().focus().unsetHighlight().run()
                        }}
                    >
                        <span className="text-xs">×</span>
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const TableDropdown = ({ editor }: { editor: any }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    className={`text-black h-8 w-8 ${editor.isActive("table") ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9]`}
                    title="Table"
                    variant="ghost"
                    size="icon"
                >
                    <TableIcon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                >
                    Insert Table
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                    Add Column Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                    Add Column After
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>Delete Column</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>Add Row Before</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>Add Row After</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>Delete Row</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>Delete Table</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder = "Write your content here...",
}: RichTextEditorProps) {
    const [textSize, setTextSize] = useState("medium")
    const [fontFamily, setFontFamily] = useState("default")

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Underline,
            Strike,
            Subscript,
            Superscript,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline decoration-primary underline-offset-4 hover:decoration-wavy",
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: "rounded-md max-w-full",
                },
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: "is-editor-empty",
            }),
            Typography,
            TextSize,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            // CodeBlockLowlight.configure({
            //     lowlight,
            // }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            HorizontalRule,
            FontFamily.configure({
                types: ["textStyle"],
            }),
        ],
        content: content || "",
        editorProps: {
            attributes: {
                class: "tiptap-content prose max-w-none focus:outline-none min-h-[300px] p-4",
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            onChange(html)
        },
    })

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    const applyTextSize = (size: string) => {
        setTextSize(size)

        let fontSize: string
        switch (size) {
            case "small":
                fontSize = "14px"
                break
            case "large":
                fontSize = "20px"
                break
            case "extra-large":
                fontSize = "24px"
                break
            case "medium":
            default:
                fontSize = "16px"
        }

        // Use the correct TipTap command for setting font size
        editor.chain().focus().setMark("textStyle", { fontSize }).run()
    }

    const applyFontFamily = (font: string) => {
        setFontFamily(font)

        switch (font) {
            case "serif":
                editor.chain().focus().setFontFamily("Georgia, serif").run()
                break
            case "mono":
                editor.chain().focus().setFontFamily("Courier New, monospace").run()
                break
            case "sans":
                editor.chain().focus().setFontFamily("Arial, sans-serif").run()
                break
            default:
                editor.chain().focus().unsetFontFamily().run()
        }
    }

    return (
        <div className="border border-black rounded-lg shadow-sm">
            {/* Main Toolbar */}
            <div className="border-b p-2 bg-white rounded-t-lg">
                {/* First Row */}
                <div className="flex items-center gap-3">


                    <div className="flex flex-wrap gap-1 mb-2 border-r border-gray-500 pr-4">
                        <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                            <Undo className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                            <Redo className="h-4 w-4" />
                        </MenuButton>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Font Family Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-black h-8 px-3 flex items-center gap-1 hover:bg-[#f9f9f9]">
                                    <Type className="h-4 w-4" />
                                    <span className="text-xs hidden sm:inline">{fontFamily}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuRadioGroup value={fontFamily} onValueChange={applyFontFamily}>
                                    <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="serif">Serif</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="sans">Sans Serif</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="mono">Monospace</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Text Size Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-black h-8 px-3 flex items-center gap-1 hover:bg-[#f9f9f9]">
                                    <TextIcon className="h-4 w-4" />
                                    <span className="text-xs hidden sm:inline">{textSize}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuRadioGroup value={textSize} onValueChange={applyTextSize}>
                                    <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="extra-large">Extra Large</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        <ColorPopover editor={editor} />
                        <HighlightPopover editor={editor} />
                    </div>

                    {/* Second Row */}
                    <div className="flex flex-wrap gap-1 mb-2">
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            active={editor.isActive("heading", { level: 1 })}
                            title="Heading 1"
                        >
                            <Heading1 className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            active={editor.isActive("heading", { level: 2 })}
                            title="Heading 2"
                        >
                            <Heading2 className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            active={editor.isActive("heading", { level: 3 })}
                            title="Heading 3"
                        >
                            <Heading3 className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            active={editor.isActive("paragraph")}
                            title="Paragraph"
                        >
                            <PilcrowSquare className="h-4 w-4" />
                        </MenuButton>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            active={editor.isActive("bold")}
                            title="Bold"
                        >
                            <Bold className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            active={editor.isActive("italic")}
                            title="Italic"
                        >
                            <Italic className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            active={editor.isActive("underline")}
                            title="Underline"
                        >
                            <UnderlineIcon className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            active={editor.isActive("strike")}
                            title="Strikethrough"
                        >
                            <Strikethrough className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleSubscript().run()}
                            active={editor.isActive("subscript")}
                            title="Subscript"
                        >
                            <SubscriptIcon className="h-4 w-4" />
                        </MenuButton>

                        <MenuButton
                            onClick={() => editor.chain().focus().toggleSuperscript().run()}
                            active={editor.isActive("superscript")}
                            title="Superscript"
                        >
                            <SuperscriptIcon className="h-4 w-4" />
                        </MenuButton>
                    </div>
                </div>
                {/* Third Row */}
                <div className="flex flex-wrap gap-1">
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign("left").run()}
                        active={editor.isActive({ textAlign: "left" })}
                        title="Align left"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </MenuButton>

                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign("center").run()}
                        active={editor.isActive({ textAlign: "center" })}
                        title="Align center"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </MenuButton>

                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign("right").run()}
                        active={editor.isActive({ textAlign: "right" })}
                        title="Align right"
                    >
                        <AlignRight className="h-4 w-4" />
                    </MenuButton>

                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                        active={editor.isActive({ textAlign: "justify" })}
                        title="Justify"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </MenuButton>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive("bulletList")}
                        title="Bullet list"
                    >
                        <List className="h-4 w-4" />
                    </MenuButton>

                    <MenuButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive("orderedList")}
                        title="Ordered list"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </MenuButton>

                    <MenuButton
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        active={editor.isActive("taskList")}
                        title="Task list"
                    >
                        <CheckSquare className="h-4 w-4" />
                    </MenuButton>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive("blockquote")}
                        title="Quote"
                    >
                        <Quote className="h-4 w-4" />
                    </MenuButton>

                    {/* <MenuButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        active={editor.isActive("codeBlock")}
                        title="Code block"
                    >
                        <Code className="h-4 w-4" />
                    </MenuButton> */}

                    <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
                        <Minus className="h-4 w-4" />
                    </MenuButton>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    <LinkPopover editor={editor} />
                    <ImagePopover editor={editor} />
                    <TableDropdown editor={editor} />
                </div>
            </div>

            {/* Editor Content */}
            <div className="tiptap-editor-wrapper">
                {/* Bubble Menu */}
                {editor && (
                    <BubbleMenu className="bubble-menu" tippyOptions={{ duration: 100 }} editor={editor}>
                        <div className="flex bg-white border shadow-lg rounded-md p-1">
                            <Button
                                type="button"
                                className={`text-black p-1 ${editor.isActive("bold") ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9]`}
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                            >
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                className={`text-black p-1 ${editor.isActive("italic") ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9]`}
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                            >
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                className={`text-black p-1 ${editor.isActive("underline") ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9]`}
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                            >
                                <UnderlineIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                className={`text-black p-1 ${editor.isActive("strike") ? "bg-[#f9f9f9]" : ""} hover:bg-[#f9f9f9]`}
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                            >
                                <Strikethrough className="h-4 w-4" />
                            </Button>
                            <Separator orientation="vertical" className="h-6 mx-1" />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button className="text-black p-1 hover:bg-[#f9f9f9]" variant="ghost" size="icon">
                                        <Link2 className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-60">
                                    <div className="flex flex-col space-y-2">
                                        <Input
                                            id="bubble-link"
                                            placeholder="https://example.com"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    editor.chain().focus().setLink({ href: e.currentTarget.value }).run()
                                                    e.preventDefault()
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                const input = document.getElementById("bubble-link") as HTMLInputElement
                                                if (input && input.value) {
                                                    editor.chain().focus().setLink({ href: input.value }).run()
                                                }
                                            }}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </BubbleMenu>
                )}

                {/* Floating Menu */}
                {/* {editor && (    
                    <FloatingMenu className="floating-menu" tippyOptions={{ duration: 100 }} editor={editor}>
                        <div className="flex bg-white border shadow-lg rounded-md p-1">
                            <Button
                                type="button"
                                className="text-black p-1 hover:bg-[#f9f9f9]"
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            >
                                <Heading1 className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                className="text-black p-1 hover:bg-[#f9f9f9]"
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            >
                                <Heading2 className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                className="text-black p-1 hover:bg-[#f9f9f9]"
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                className="text-black p-1 hover:bg-[#f9f9f9]"
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            >
                                <Quote className="h-4 w-4" />
                            </Button>
                        </div>
                    </FloatingMenu>
                )} */}

                <EditorContent className="tiptap-content" editor={editor} />
            </div>
        </div>
    )
}
