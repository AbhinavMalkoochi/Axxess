

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/card"
import { Switch } from "./components/ui/switch"
import { Bell, CalendarIcon, ChevronDown, MessageSquare, Search, Stethoscope, Users, Upload } from "lucide-react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Input } from "./components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import OpenAI from "openai"
import { useGraphStore } from "./store"
import { useNavigate } from "@tanstack/react-router"



interface Node {
    id: number;
    name: string;
    role: string;
    industry: string;
    skills: string[];
}

interface Edge {
    from: number;
    to: number;
}
export default function NetworkVisualization() {
    const [visualizationType, setVisualizationType] = useState<"3d" | "heatmap" | "list">("3d")
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [messages, setMessages] = useState<string[]>([])
    const [inputMessage, setInputMessage] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [skillFilter, setSkillFilter] = useState("")
    const [industryFilter, setIndustryFilter] = useState("")
    const [message, setMessage] = useState("")
    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])

    const mountRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const controlsRef = useRef<OrbitControls | null>(null)
    const nodeMeshesRef = useRef<{ [key: number]: THREE.Mesh }>({})
    const { value } = useGraphStore();
    const openai = new OpenAI({
        apiKey: `${import.meta.env.VITE_OPENAI_API_KEY}`, dangerouslyAllowBrowser: true
    });
    useEffect(() => {
        if (!mountRef.current || visualizationType !== "3d") return

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x000000)
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000,
        )

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)

        if (!mountRef.current.children.length) {
            mountRef.current.appendChild(renderer.domElement)
        }

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true

        sceneRef.current = scene
        cameraRef.current = camera
        rendererRef.current = renderer
        controlsRef.current = controls

        // Add raycaster for hover/click detection
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        let hoveredNode: THREE.Mesh | null = null

        // Create tooltip div
        const tooltip = document.createElement('div')
        tooltip.style.position = 'absolute'
        tooltip.style.padding = '10px'
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
        tooltip.style.color = 'white'
        tooltip.style.borderRadius = '4px'
        tooltip.style.display = 'none'
        tooltip.style.zIndex = '1000'
        mountRef.current.appendChild(tooltip)

        nodes.forEach((node) => {
            let color;
            switch (node.role) {
                case "Patient":
                    color = 0xff0000;
                    break;
                case "Medication":
                    color = 0x00ff00;
                    break;
                default:
                    color = 0x0000ff;
            }

            const nodeMaterial = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.8
            })
            const nodeGeometry = new THREE.SphereGeometry(0.5, 32, 32)
            const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial)

            mesh.position.set(
                Math.random() * 20 - 10,
                Math.random() * 20 - 10,
                Math.random() * 20 - 10
            )
            mesh.userData = node
            scene.add(mesh)
            nodeMeshesRef.current[node.id] = mesh
        })

        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa })
        edges.forEach((edge) => {
            if (nodeMeshesRef.current[edge.from] && nodeMeshesRef.current[edge.to]) {
                const points = [
                    nodeMeshesRef.current[edge.from].position,
                    nodeMeshesRef.current[edge.to].position
                ]
                const geometry = new THREE.BufferGeometry().setFromPoints(points)
                const line = new THREE.Line(geometry, edgeMaterial)
                scene.add(line)
            }
        })

        camera.position.z = 20

        // Handle mouse move for hover effect
        const onMouseMove = (event: MouseEvent) => {
            mouse.x = ((event.clientX - mountRef.current!.offsetLeft) / mountRef.current!.clientWidth) * 2 - 1
            mouse.y = -((event.clientY - mountRef.current!.offsetTop) / mountRef.current!.clientHeight) * 2 + 1

            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(scene.children)

            // Reset previous hover state
            if (hoveredNode) {
                (hoveredNode.material as THREE.MeshBasicMaterial).opacity = 0.8
            }

            // Handle hover
            if (intersects.length > 0 && intersects[0].object instanceof THREE.Mesh) {
                const mesh = intersects[0].object as THREE.Mesh
                if (mesh.userData) {
                    hoveredNode = mesh
                        ; (mesh.material as THREE.MeshBasicMaterial).opacity = 1

                    // Update tooltip
                    const node = mesh.userData as Node
                    tooltip.innerHTML = `
                    <div>
                        <strong>${node.name}</strong><br/>
                        Role: ${node.role}<br/>
                        ${node.role === "Patient" ? `Condition: ${(node as any).condition}<br/>` : ""}
                    </div>
                `
                    tooltip.style.display = 'block'
                    tooltip.style.left = `${event.clientX + 10}px`
                    tooltip.style.top = `${event.clientY + 10}px`
                }
            } else {
                hoveredNode = null
                tooltip.style.display = 'none'
            }
        }

        // Handle click for node selection
        const onClick = (event: MouseEvent) => {
            mouse.x = ((event.clientX - mountRef.current!.offsetLeft) / mountRef.current!.clientWidth) * 2 - 1
            mouse.y = -((event.clientY - mountRef.current!.offsetTop) / mountRef.current!.clientHeight) * 2 + 1

            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(scene.children)

            if (intersects.length > 0 && intersects[0].object instanceof THREE.Mesh) {
                const mesh = intersects[0].object as THREE.Mesh
                if (mesh.userData) {
                    setSelectedNode(mesh.userData as Node)
                }
            } else {
                setSelectedNode(null)
            }
        }

        mountRef.current.addEventListener('mousemove', onMouseMove)
        mountRef.current.addEventListener('click', onClick)

        const animate = () => {
            requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        return () => {
            cancelAnimationFrame(0)
            renderer.dispose()
            scene.clear()
            mountRef.current?.removeEventListener('mousemove', onMouseMove)
            mountRef.current?.removeEventListener('click', onClick)
            tooltip.remove()
            if (mountRef.current?.children[0]) {
                mountRef.current.removeChild(mountRef.current.children[0])
            }
        }
    }, [nodes, edges, visualizationType])


    useEffect(() => {
        const handleResize = () => {
            if (!mountRef.current || !cameraRef.current || !rendererRef.current) return


            const width = mountRef.current.clientWidth
            const height = mountRef.current.clientHeight


            cameraRef.current.aspect = width / height
            cameraRef.current.updateProjectionMatrix()
            rendererRef.current.setSize(width, height)
        }


        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])


    useEffect(() => {
        if (visualizationType !== "3d") return


        const handleClick = (event: MouseEvent) => {
            if (!mountRef.current || !cameraRef.current || !sceneRef.current) return


            const mouse = new THREE.Vector2()
            mouse.x = (event.clientX / mountRef.current.clientWidth) * 2 - 1
            mouse.y = -(event.clientY / mountRef.current.clientHeight) * 2 + 1


            const raycaster = new THREE.Raycaster()
            raycaster.setFromCamera(mouse, cameraRef.current)
            const intersects = raycaster.intersectObjects(sceneRef.current.children)


            if (intersects.length > 0) {
                const clickedNode = intersects[0].object
                if (clickedNode.userData) {
                    setSelectedNode(clickedNode.userData as Node)
                }
            }
        }


        window.addEventListener("click", handleClick)
        return () => window.removeEventListener("click", handleClick)
    }, [visualizationType]) // Add visualizationType as a dependency


    const sendMessage = () => {
        if (inputMessage.trim()) {
            setMessages([...messages, `You: ${inputMessage}`])
            setInputMessage("")
        }
    }


    const filteredNodes = nodes.filter(
        (node) =>
            (!roleFilter || node.role === roleFilter) &&
            (!skillFilter || node.skills.includes(skillFilter)) &&
            (!industryFilter || node.industry === industryFilter),
    )


    useEffect(() => {
        if (!sceneRef.current) return


        Object.values(nodeMeshesRef.current).forEach((mesh) => {
            const node = mesh.userData as Node
            mesh.visible = filteredNodes.some((n) => n.id === node.id)
        })
    }, [filteredNodes])
    const connectOpenAI = async () => {
        console.log("Connecting to OpenAI with value:", value)
        const openAIResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a medical data processor. Given a patient’s audio summary describing their condition and prescribed medications, extract relevant information and format it as structured JSON.
Format:

    Nodes: Represent the patient, their condition(s), and prescribed medications.
        Patient Node: { id: number, name: string, role: "Patient", condition: string }
        Medication Node: { id: number, name: string }
    Edges: Show relationships between the patient, their condition(s), and prescribed medications.
        { from: patient_id, to: condition_id } (Patient has Condition)
        { from: condition_id, to: medication_id } (Condition is treated by Medication)

Example Output:

Input: "John Doe has diabetes and high blood pressure. He takes Metformin for diabetes and Lisinopril for blood pressure. Following is the audio summary and other information about the patient ${value}`
                },

            ],
        });
        console.log("openAIResponse", openAIResponse.choices[0].message.content)
        if (!openAIResponse.choices[0].message.content) {
            console.error("No content in OpenAI response")
            return
        }
        const cleanJsonString = openAIResponse.choices[0].message.content
            .replace(/```json/g, '')  // Remove ```json
            .replace(/```/g, '')      // Remove remaining backticks
            .trim();                  // Remove extra whitespace

        // Parse the cleaned JSON string
        const responseJson = JSON.parse(cleanJsonString);

        // Map the nodes to the required format
        const nodes = responseJson.nodes.map((node: Node) => ({
            id: node.id,
            name: node.name,
            role: node.role || "Medication", // Default to Medication if role not specified
            industry: "Healthcare",
            skills: [] // Empty array as per format
        }));

        // Extract edges directly as they're already in the correct format
        const edges = responseJson.edges;

        // Set the states
        setNodes(nodes);
        setEdges(edges);
    }
    const navigate = useNavigate()
    const [isLeftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
    const [isRightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)


    return (
        <div className="flex min-h-screen bg-background min-w-screen w-screen">
{/* Sidebar */}
<div className="hidden w-80 flex-col border-r relative bg-white dark:bg-gray-800 shadow-sm md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold">MedCare Pro</h2>
          </div>
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients..."
                className="w-full bg-gray-50 dark:bg-gray-700 pl-10 h-12 rounded-xl"
              />
            </div>
          </div>
          <nav className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-semibold">Patients</span>
              </div>
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    onClick={()=>navigate({to:'/'})}
                    className="w-full justify-start gap-3 rounded-xl h-14 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                      <AvatarFallback>P{i + 1}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Patient {i + 1}</span>
                      <span className="text-xs text-muted-foreground">Last visit: 2 days ago</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
            {/* Main Content Area */}
            <main
                className={`flex-1 transition-all duration-300 ease-in-out 
                    } min-w-screen`}
            >
                <div className="max-w-7xl mx-auto p-8 space-y-6 w-full">
                    <header className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Your Network</h1>
                        <div className="flex flex-wrap gap-2">
            <Button onClick={connectOpenAI} variant="default">
              Generate Graph
            </Button>
          </div>                    </header>


                    <Card className="bg-black p-4">
                        <div className="w-full h-[500px] rounded-lg">
                            {visualizationType === "3d" ? (
                                <div ref={mountRef} className="w-full h-full" />
                            ) : (
                                <div className="w-full h-full overflow-auto">
                                    <table className="w-full text-sm text-left text-white">
                                        <thead className="text-xs uppercase bg-white/10 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3">Name</th>
                                                <th className="px-6 py-3">Role</th>
                                                <th className="px-6 py-3">Industry</th>
                                                <th className="px-6 py-3">Skills</th>
                                                <th className="px-6 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredNodes.map((node) => (
                                                <tr key={node.id} className="border-b border-white/10 hover:bg-white/5">
                                                    <td className="px-6 py-4 font-medium">{node.name}</td>
                                                    <td className="px-6 py-4">{node.role}</td>
                                                    <td className="px-6 py-4">{node.industry}</td>
                                                    <td className="px-6 py-4">{node.skills.join(", ")}</td>
                                                    <td className="px-6 py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedNode(node)}
                                                            className="text-primary hover:text-primary/80"
                                                        >
                                                            View Details
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Card>


                    <Card className="bg-white/5 p-6 space-y-4">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    variant={visualizationType === "3d" ? "default" : "outline"}
                                    onClick={() => {
                                        if (visualizationType !== "3d") {
                                            // Clean up any existing 3D scene
                                            if (rendererRef.current) {
                                                rendererRef.current.dispose()
                                            }
                                            if (sceneRef.current) {
                                                sceneRef.current.clear()
                                            }
                                            if (mountRef.current?.children[0]) {
                                                mountRef.current.removeChild(mountRef.current.children[0])
                                            }
                                            setVisualizationType("3d")
                                        }
                                    }}
                                    className={`flex-1 ${visualizationType === "3d"
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : "border-purple-600 text-purple-600 hover:bg-purple-600/10"
                                        }`}
                                >
                                    3D Web
                                </Button>
                                <Button
                                    variant={visualizationType === "list" ? "default" : "outline"}
                                    onClick={() => {
                                        if (visualizationType !== "list") {
                                            // Clean up 3D scene when switching to list
                                            if (rendererRef.current) {
                                                rendererRef.current.dispose()
                                            }
                                            if (sceneRef.current) {
                                                sceneRef.current.clear()
                                            }
                                            if (mountRef.current?.children[0]) {
                                                mountRef.current.removeChild(mountRef.current.children[0])
                                            }
                                            setVisualizationType("list")
                                        }
                                    }}
                                    className={`flex-1 ${visualizationType === "list"
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : "border-purple-600 text-purple-600 hover:bg-purple-600/10"
                                        }`}
                                >
                                    List
                                </Button>
                            </div>
                            <div className="flex gap-2">

                            </div>
                        </div>
                    </Card>


                    {selectedNode && (
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>Selected Node Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>
                                    <strong>Name:</strong> {selectedNode.name}
                                </p>
                                <p>
                                    <strong>Role:</strong> {selectedNode.role}
                                </p>
                                <p>
                                    <strong>Industry:</strong> {selectedNode.industry}
                                </p>
                                <p>
                                    <strong>Skills:</strong> {selectedNode.skills}
                                </p>
                                <div className="mt-4 space-x-2">
                                    <Button>Message</Button>
                                    <Button variant="outline">View Profile</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main >
        </div >
    )
}
